import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  useContentLibrary,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
  useToggleFavorite,
  type Content,
} from "@/hooks/useContentLibrary";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Sparkles,
  FileText,
  Image,
  Video,
  Music,
  Loader2,
  Star,
  Copy,
  Tag,
  ImagePlus,
  Palette,
  Mic,
  Volume2,
  VolumeX,
  Square,
} from "lucide-react";

const CONTENT_TYPES = [
  { value: "all", label: "Todos", icon: FileText },
  { value: "text", label: "Texto", icon: FileText },
  { value: "image", label: "Imagem", icon: Image },
  { value: "video", label: "Vídeo", icon: Video },
  { value: "audio", label: "Áudio", icon: Music },
  { value: "carousel", label: "Carrossel", icon: Image },
];

const TEMPLATES = [
  { name: "Post LinkedIn", prompt: "Crie um post profissional para LinkedIn sobre", platform: "linkedin", type: "text" as const },
  { name: "Caption Instagram", prompt: "Crie uma caption envolvente para Instagram sobre", platform: "instagram", type: "text" as const },
  { name: "Thread Twitter/X", prompt: "Crie uma thread informativa para Twitter/X sobre", platform: "twitter", type: "text" as const },
  { name: "Script TikTok", prompt: "Crie um roteiro curto para vídeo TikTok sobre", platform: "tiktok", type: "text" as const },
  { name: "Email Marketing", prompt: "Crie um email de marketing persuasivo sobre", platform: "email", type: "text" as const },
  { name: "Descrição YouTube", prompt: "Crie uma descrição otimizada para SEO de um vídeo do YouTube sobre", platform: "youtube", type: "text" as const },
];

const TONES = [
  { value: "profissional", label: "Profissional" },
  { value: "casual", label: "Casual" },
  { value: "humoristico", label: "Humorístico" },
  { value: "inspirador", label: "Inspirador" },
  { value: "educativo", label: "Educativo" },
  { value: "urgente", label: "Urgente" },
];

const AUDIO_FORMATS = [
  { value: "podcast", label: "🎙️ Podcast" },
  { value: "narração", label: "🎤 Narração" },
  { value: "jingle", label: "🎵 Jingle" },
  { value: "música", label: "🎶 Música" },
];

const AUDIO_DURATIONS = [
  { value: "curto", label: "Curto (30s–1min)" },
  { value: "médio", label: "Médio (2–5min)" },
  { value: "longo", label: "Longo (5–15min)" },
];

const VIDEO_FORMATS = [
  { value: "reels", label: "📱 Reels/Shorts" },
  { value: "youtube", label: "▶️ YouTube" },
  { value: "tutorial", label: "📚 Tutorial" },
  { value: "storytelling", label: "🎬 Storytelling" },
];

const VIDEO_DURATIONS = [
  { value: "curto", label: "Curto (15–60s)" },
  { value: "médio", label: "Médio (2–10min)" },
  { value: "longo", label: "Longo (10–30min)" },
];

/** Get user session token for edge function auth */
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Você precisa estar logado para usar esta funcionalidade.");
  return session.access_token;
}

/** Stream SSE from edge function using user's auth token */
async function streamFromEdge(
  fnName: string,
  body: object,
  onChunk: (text: string) => void,
): Promise<string> {
  const token = await getAuthToken();
  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error || "Erro na geração");
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No stream");
  const decoder = new TextDecoder();
  let buffer = "";
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          result += content;
          onChunk(result);
        }
      } catch {}
    }
  }
  return result;
}

export default function ContentLibraryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("profissional");
  const [aiPlatform, setAiPlatform] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  // Manual create state
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newType, setNewType] = useState<string>("text");
  const [newTags, setNewTags] = useState("");

  // Image generation state
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgStyle, setImgStyle] = useState("fotográfico");
  const [imgGenerating, setImgGenerating] = useState(false);
  const [imgPreview, setImgPreview] = useState("");
  const [imgUrl, setImgUrl] = useState("");

  // Audio generation state
  const [audioPrompt, setAudioPrompt] = useState("");
  const [audioFormat, setAudioFormat] = useState("podcast");
  const [audioDuration, setAudioDuration] = useState("médio");
  const [audioGenerating, setAudioGenerating] = useState(false);
  const [audioResult, setAudioResult] = useState("");

  // Video generation state
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoFormat, setVideoFormat] = useState("youtube");
  const [videoDuration, setVideoDuration] = useState("médio");
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoResult, setVideoResult] = useState("");

  // TTS state
  const [ttsPlaying, setTtsPlaying] = useState<string | null>(null);
  const synthRef = useRef(window.speechSynthesis);

  const IMG_STYLES = [
    { value: "fotográfico", label: "Fotográfico" },
    { value: "ilustração", label: "Ilustração" },
    { value: "3D render", label: "3D" },
    { value: "minimalista", label: "Minimalista" },
    { value: "arte digital", label: "Arte Digital" },
    { value: "aquarela", label: "Aquarela" },
  ];

  const { data: contents = [], isLoading } = useContentLibrary({
    type: typeFilter,
    status: statusFilter,
    search: search || undefined,
    favorites: favoritesOnly || undefined,
  });

  const createContent = useCreateContent();
  const updateContent = useUpdateContent();
  const deleteContent = useDeleteContent();
  const toggleFavorite = useToggleFavorite();

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiResult("");
    try {
      await streamFromEdge("generate-content", {
        type: "text",
        prompt: aiPrompt,
        platform: aiPlatform || undefined,
        tone: aiTone,
      }, setAiResult);
    } catch (e: any) {
      toast({ title: "Erro na geração", description: e.message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveAIContent = () => {
    if (!aiResult || !user) return;
    createContent.mutate({
      user_id: user.id,
      type: "text",
      title: aiPrompt.slice(0, 80),
      body: aiResult,
      ai_prompt: aiPrompt,
      ai_model: "google/gemini-3-flash-preview",
      tags: aiPlatform ? [aiPlatform] : [],
      status: "draft",
    });
    setAiOpen(false);
    setAiPrompt("");
    setAiResult("");
    setSelectedTemplate(null);
  };

  const handleCreateManual = () => {
    if (!newTitle || !user) return;
    createContent.mutate({
      user_id: user.id,
      type: newType as any,
      title: newTitle,
      body: newBody,
      tags: newTags ? newTags.split(",").map((t) => t.trim()) : [],
      status: "draft",
    });
    setCreateOpen(false);
    setNewTitle("");
    setNewBody("");
    setNewTags("");
  };

  const handleImageGenerate = async () => {
    if (!imgPrompt.trim()) return;
    setImgGenerating(true);
    setImgPreview("");
    setImgUrl("");
    try {
      const token = await getAuthToken();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt: imgPrompt, style: imgStyle }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Erro na geração");
      }
      const data = await resp.json();
      setImgPreview(data.base64);
      setImgUrl(data.image_url);
    } catch (e: any) {
      toast({ title: "Erro na geração de imagem", description: e.message, variant: "destructive" });
    } finally {
      setImgGenerating(false);
    }
  };

  const handleSaveImage = () => {
    if (!imgUrl || !user) return;
    createContent.mutate({
      user_id: user.id,
      type: "image",
      title: imgPrompt.slice(0, 80),
      media_url: imgUrl,
      ai_prompt: imgPrompt,
      ai_model: "google/gemini-3-pro-image-preview",
      tags: ["imagem-ia", imgStyle],
      status: "draft",
    });
    setImageOpen(false);
    setImgPrompt("");
    setImgPreview("");
    setImgUrl("");
  };

  const handleAudioGenerate = async () => {
    if (!audioPrompt.trim()) return;
    setAudioGenerating(true);
    setAudioResult("");
    try {
      await streamFromEdge("generate-audio-script", {
        prompt: audioPrompt,
        format: audioFormat,
        duration: audioDuration,
      }, setAudioResult);
    } catch (e: any) {
      toast({ title: "Erro na geração de áudio", description: e.message, variant: "destructive" });
    } finally {
      setAudioGenerating(false);
    }
  };

  const handleSaveAudio = () => {
    if (!audioResult || !user) return;
    createContent.mutate({
      user_id: user.id,
      type: "audio",
      title: `${audioFormat.charAt(0).toUpperCase() + audioFormat.slice(1)}: ${audioPrompt.slice(0, 60)}`,
      body: audioResult,
      ai_prompt: audioPrompt,
      ai_model: "google/gemini-3-flash-preview",
      tags: [audioFormat, "áudio-ia"],
      status: "draft",
    });
    setAudioOpen(false);
    setAudioPrompt("");
    setAudioResult("");
  };

  const handleVideoGenerate = async () => {
    if (!videoPrompt.trim()) return;
    setVideoGenerating(true);
    setVideoResult("");
    try {
      await streamFromEdge("generate-video-script", {
        prompt: videoPrompt,
        format: videoFormat,
        duration: videoDuration,
      }, setVideoResult);
    } catch (e: any) {
      toast({ title: "Erro na geração de vídeo", description: e.message, variant: "destructive" });
    } finally {
      setVideoGenerating(false);
    }
  };

  const handleSaveVideo = () => {
    if (!videoResult || !user) return;
    createContent.mutate({
      user_id: user.id,
      type: "video",
      title: `${videoFormat.charAt(0).toUpperCase() + videoFormat.slice(1)}: ${videoPrompt.slice(0, 60)}`,
      body: videoResult,
      ai_prompt: videoPrompt,
      ai_model: "google/gemini-3-flash-preview",
      tags: [videoFormat, "vídeo-ia"],
      status: "draft",
    });
    setVideoOpen(false);
    setVideoPrompt("");
    setVideoResult("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado para a área de transferência!" });
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "image": return <Image className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      case "audio": case "music": return <Music className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // TTS player
  const handleTTS = useCallback((itemId: string, text: string) => {
    if (ttsPlaying === itemId) {
      synthRef.current.cancel();
      setTtsPlaying(null);
      return;
    }
    synthRef.current.cancel();
    // Clean script markers for better TTS
    const cleaned = text.replace(/\[.*?\]/g, "").replace(/\n{2,}/g, "\n");
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = "pt-BR";
    const voices = synthRef.current.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith("pt"));
    if (ptVoice) utterance.voice = ptVoice;
    utterance.onend = () => setTtsPlaying(null);
    utterance.onerror = () => setTtsPlaying(null);
    setTtsPlaying(itemId);
    synthRef.current.speak(utterance);
  }, [ttsPlaying]);

  const stopTTS = useCallback(() => {
    synthRef.current.cancel();
    setTtsPlaying(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Biblioteca de Conteúdo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crie, organize e gerencie seus conteúdos com IA
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* AI Generate */}
          <Dialog open={aiOpen} onOpenChange={setAiOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Gerar com IA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Gerar Conteúdo com IA
                </DialogTitle>
              </DialogHeader>

              <div>
                <Label className="text-sm font-medium">Templates rápidos</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {TEMPLATES.map((t, i) => (
                    <Button
                      key={i}
                      variant={selectedTemplate === i ? "default" : "outline"}
                      size="sm"
                      className="text-xs justify-start"
                      onClick={() => {
                        setSelectedTemplate(i);
                        setAiPrompt(t.prompt + " ");
                        setAiPlatform(t.platform);
                      }}
                    >
                      {t.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tom de voz</Label>
                    <Select value={aiTone} onValueChange={setAiTone}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TONES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Plataforma</Label>
                    <Select value={aiPlatform} onValueChange={setAiPlatform}>
                      <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Prompt</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Descreva o conteúdo que deseja gerar..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleAIGenerate}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="w-full gap-2"
                >
                  {aiGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {aiGenerating ? "Gerando..." : "Gerar Conteúdo"}
                </Button>

                {aiResult && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Resultado</Label>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(aiResult)}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-foreground">
                      {aiResult}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                {aiResult && (
                  <Button onClick={handleSaveAIContent} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Salvar na Biblioteca
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Manual Create */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Manual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Conteúdo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título do conteúdo" />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.filter((t) => t.value !== "all").map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Conteúdo</Label>
                  <Textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Corpo do conteúdo..." rows={5} />
                </div>
                <div>
                  <Label>Tags (separadas por vírgula)</Label>
                  <Input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="marketing, social, promoção" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateManual} disabled={!newTitle}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Image Generate */}
          <Dialog open={imageOpen} onOpenChange={setImageOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ImagePlus className="h-4 w-4" />
                Gerar Imagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Gerar Imagem com IA
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Prompt</Label>
                  <Textarea value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} placeholder="Descreva a imagem que deseja criar..." rows={3} />
                </div>
                <div>
                  <Label>Estilo</Label>
                  <Select value={imgStyle} onValueChange={setImgStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {IMG_STYLES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleImageGenerate} disabled={imgGenerating || !imgPrompt.trim()} className="w-full gap-2">
                  {imgGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {imgGenerating ? "Gerando..." : "Gerar Imagem"}
                </Button>
                {imgPreview && (
                  <div className="rounded-lg border overflow-hidden">
                    <img src={imgPreview} alt="Imagem gerada" className="w-full h-auto max-h-[300px] object-contain bg-muted" />
                  </div>
                )}
              </div>
              <DialogFooter>
                {imgPreview && (
                  <Button onClick={handleSaveImage} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Salvar na Biblioteca
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Audio Generate */}
          <Dialog open={audioOpen} onOpenChange={setAudioOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Mic className="h-4 w-4" />
                Gerar Áudio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Gerar Roteiro de Áudio com IA
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Formato</Label>
                    <Select value={audioFormat} onValueChange={setAudioFormat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AUDIO_FORMATS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duração</Label>
                    <Select value={audioDuration} onValueChange={setAudioDuration}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AUDIO_DURATIONS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Prompt</Label>
                  <Textarea
                    value={audioPrompt}
                    onChange={(e) => setAudioPrompt(e.target.value)}
                    placeholder="Descreva o roteiro de áudio que deseja gerar... Ex: podcast sobre marketing digital para iniciantes"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleAudioGenerate}
                  disabled={audioGenerating || !audioPrompt.trim()}
                  className="w-full gap-2"
                >
                  {audioGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                  {audioGenerating ? "Gerando..." : "Gerar Roteiro de Áudio"}
                </Button>

                {audioResult && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Roteiro Gerado</Label>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(audioResult)}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-foreground max-h-[300px] overflow-y-auto">
                      {audioResult}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                {audioResult && (
                  <Button onClick={handleSaveAudio} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Salvar na Biblioteca
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Video Generate */}
          <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Video className="h-4 w-4" />
                Gerar Vídeo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Gerar Roteiro de Vídeo com IA
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Formato</Label>
                    <Select value={videoFormat} onValueChange={setVideoFormat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VIDEO_FORMATS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duração</Label>
                    <Select value={videoDuration} onValueChange={setVideoDuration}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VIDEO_DURATIONS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Prompt</Label>
                  <Textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="Descreva o roteiro de vídeo que deseja gerar... Ex: tutorial sobre como usar Instagram para negócios"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleVideoGenerate}
                  disabled={videoGenerating || !videoPrompt.trim()}
                  className="w-full gap-2"
                >
                  {videoGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  {videoGenerating ? "Gerando..." : "Gerar Roteiro de Vídeo"}
                </Button>

                {videoResult && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Roteiro Gerado</Label>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(videoResult)}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-foreground max-h-[300px] overflow-y-auto">
                      {videoResult}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                {videoResult && (
                  <Button onClick={handleSaveVideo} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Salvar na Biblioteca
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar conteúdo..." className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={favoritesOnly ? "default" : "outline"} size="icon" onClick={() => setFavoritesOnly(!favoritesOnly)}>
          <Star className={`h-4 w-4 ${favoritesOnly ? "fill-current" : ""}`} />
        </Button>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : contents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-foreground mb-1">Nenhum conteúdo encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comece gerando conteúdo com IA ou crie manualmente
            </p>
            <Button onClick={() => setAiOpen(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar com IA
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contents.map((item) => (
            <Card key={item.id} className="group hover:border-primary/30 transition-colors overflow-hidden">
              {/* Image thumbnail */}
              {item.type === "image" && item.media_url && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={item.media_url}
                    alt={item.title || "Imagem"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {typeIcon(item.type)}
                    <CardTitle className="text-sm font-medium truncate">
                      {item.title || "Sem título"}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* TTS button for audio/music */}
                    {(item.type === "audio" || item.type === "music") && item.body && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleTTS(item.id, item.body!)}
                        title={ttsPlaying === item.id ? "Parar" : "Ouvir"}
                      >
                        {ttsPlaying === item.id ? (
                          <Square className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 text-primary" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        toggleFavorite.mutate({
                          id: item.id,
                          is_favorite: !item.is_favorite,
                        })
                      }
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          item.is_favorite
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => item.body && copyToClipboard(item.body)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateContent.mutate({
                              id: item.id,
                              status: item.status === "draft" ? "approved" : "draft",
                            })
                          }
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {item.status === "draft" ? "Aprovar" : "Voltar p/ rascunho"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteContent.mutate(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.body && (
                  <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                    {item.body}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {item.status === "draft"
                      ? "Rascunho"
                      : item.status === "approved"
                      ? "Aprovado"
                      : item.status === "published"
                      ? "Publicado"
                      : "Arquivado"}
                  </Badge>
                  {item.ai_model && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      IA
                    </Badge>
                  )}
                  {item.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      <Tag className="h-2 w-2 mr-0.5" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/60">
                  {new Date(item.created_at).toLocaleDateString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
