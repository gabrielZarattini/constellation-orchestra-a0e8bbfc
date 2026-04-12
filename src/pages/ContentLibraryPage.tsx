import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useContentLibrary,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
  useToggleFavorite,
  type Content,
} from "@/hooks/useContentLibrary";
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
  Heart,
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
  Filter,
  Copy,
  Tag,
  ImagePlus,
  Palette,
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

export default function ContentLibraryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

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
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            type: "text",
            prompt: aiPrompt,
            platform: aiPlatform || undefined,
            tone: aiTone,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Generation failed");
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
              setAiResult(result);
            }
          } catch {}
        }
      }
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
        <div className="flex gap-2">
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

              {/* Templates */}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(aiResult)}
                      >
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
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Título do conteúdo"
                  />
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
                  <Textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="Corpo do conteúdo..."
                    rows={5}
                  />
                </div>
                <div>
                  <Label>Tags (separadas por vírgula)</Label>
                  <Input
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="marketing, social, promoção"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateManual} disabled={!newTitle}>
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conteúdo..."
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={favoritesOnly ? "default" : "outline"}
          size="icon"
          onClick={() => setFavoritesOnly(!favoritesOnly)}
        >
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
            <Card key={item.id} className="group hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {typeIcon(item.type)}
                    <CardTitle className="text-sm font-medium truncate">
                      {item.title || "Sem título"}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
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
