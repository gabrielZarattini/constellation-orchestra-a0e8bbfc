import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const PLAN_MAP: Record<string, string> = {};

async function getPlanFromPrice(priceId: string): Promise<string> {
  if (PLAN_MAP[priceId]) return PLAN_MAP[priceId];
  const price = await stripe.prices.retrieve(priceId);
  const product = await stripe.products.retrieve(price.product as string);
  const name = (product.metadata?.plan_key || product.name || "free").toLowerCase();
  if (name.includes("enterprise")) return "enterprise";
  if (name.includes("pro")) return "pro";
  if (name.includes("starter")) return "starter";
  return "free";
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  const email = customer.email;
  if (!email) return;

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const user = authUsers?.users?.find((u) => u.email === email);
  if (!user) return;

  const priceId = sub.items.data[0]?.price?.id;
  const plan = priceId ? await getPlanFromPrice(priceId) : "free";

  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "unpaid",
  };

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const payload = {
    user_id: user.id,
    plan,
    status: statusMap[sub.status] || "active",
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
  };

  if (existing) {
    await supabase.from("subscriptions").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("subscriptions").insert(payload);
  }

  // Update credits based on plan
  const creditMap: Record<string, number> = { starter: 500, pro: 2000, enterprise: 10000 };
  const credits = creditMap[plan] || 100;
  await supabase.from("credits").update({ balance: credits, lifetime_earned: credits }).eq("user_id", user.id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Webhook signature verification failed", { status: 400 });
    }
  } else {
    event = JSON.parse(body) as Stripe.Event;
  }

  console.log("Stripe event:", event.type);

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertSubscription(sub);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response("Webhook processing error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
