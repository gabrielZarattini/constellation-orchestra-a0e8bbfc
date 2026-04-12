import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Content = Tables<"content_library">;
type ContentInsert = TablesInsert<"content_library">;
type ContentUpdate = TablesUpdate<"content_library">;

export function useContentLibrary(filters?: {
  type?: string;
  status?: string;
  tag?: string;
  search?: string;
  favorites?: boolean;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["content-library", filters],
    queryFn: async () => {
      let query = supabase
        .from("content_library")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type as any);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as any);
      }
      if (filters?.favorites) {
        query = query.eq("is_favorite", true);
      }
      if (filters?.tag) {
        query = query.contains("tags", [filters.tag]);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,body.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Content[];
    },
    enabled: !!user,
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (content: ContentInsert) => {
      const { data, error } = await supabase
        .from("content_library")
        .insert(content)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
      toast({ title: "Conteúdo criado com sucesso!" });
    },
    onError: (e) => {
      toast({ title: "Erro ao criar conteúdo", description: e.message, variant: "destructive" });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ContentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("content_library")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_library").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
      toast({ title: "Conteúdo removido" });
    },
    onError: (e) => {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      const { error } = await supabase
        .from("content_library")
        .update({ is_favorite })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
    },
  });
}

export type { Content };
