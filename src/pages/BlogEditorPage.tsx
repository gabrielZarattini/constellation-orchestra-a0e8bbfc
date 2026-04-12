import { useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Bold, Italic, Heading1, Heading2, List, ListOrdered, Link, Image,
  Sparkles, Send, Loader2, FileText, BookOpen, LayoutTemplate,
} from 'lucide-react';

const SEO_TEMPLATES: Record<string, { label: string; icon: string; html: string }> = {
  howto: {
    label: 'How-to',
    icon: '📝',
    html: `<h2>Como [Alcançar Resultado Desejado] em [X] Passos</h2>
<p><strong>Introdução:</strong> Apresente o problema que o leitor enfrenta e prometa a solução.</p>
<h3>Passo 1: [Título do Passo]</h3>
<p>Descreva o primeiro passo com detalhes práticos.</p>
<h3>Passo 2: [Título do Passo]</h3>
<p>Continue com instruções claras e acionáveis.</p>
<h3>Passo 3: [Título do Passo]</h3>
<p>Finalize com o último passo essencial.</p>
<h2>Conclusão</h2>
<p>Resuma os principais pontos e inclua um call-to-action.</p>`,
  },
  listicle: {
    label: 'Listicle',
    icon: '📋',
    html: `<h2>[X] [Substantivo] que Vão [Benefício] em [Ano]</h2>
<p><strong>Introdução:</strong> Contextualize o tema e explique por que esta lista é relevante.</p>
<h3>1. [Item do Lista]</h3>
<p>Explique o item, seus benefícios e como utilizá-lo.</p>
<h3>2. [Item do Lista]</h3>
<p>Detalhe o segundo item com exemplos práticos.</p>
<h3>3. [Item do Lista]</h3>
<p>Apresente o terceiro item e por que se destaca.</p>
<h2>Conclusão</h2>
<p>Resuma as melhores opções e recomende a escolha ideal.</p>`,
  },
  casestudy: {
    label: 'Case Study',
    icon: '🔬',
    html: `<h2>Como [Empresa/Pessoa] Alcançou [Resultado] com [Solução]</h2>
<h3>O Desafio</h3>
<p>Descreva o problema ou desafio enfrentado.</p>
<h3>A Solução</h3>
<p>Explique a solução implementada, as ferramentas e estratégias usadas.</p>
<h3>Os Resultados</h3>
<p>Apresente métricas, números e resultados concretos alcançados.</p>
<h3>Lições Aprendidas</h3>
<p>Compartilhe insights e aprendizados que o leitor pode aplicar.</p>
<h2>Conclusão</h2>
<p>Resuma o caso e incentive o leitor a agir.</p>`,
  },
  tutorial: {
    label: 'Tutorial',
    icon: '🎓',
    html: `<h2>Tutorial Completo: [Título do Tutorial]</h2>
<h3>Pré-requisitos</h3>
<ul><li>Requisito 1</li><li>Requisito 2</li></ul>
<h3>Parte 1: [Fundamentos]</h3>
<p>Explique os conceitos básicos necessários.</p>
<h3>Parte 2: [Implementação]</h3>
<p>Guie o leitor pela implementação prática.</p>
<h3>Parte 3: [Otimização]</h3>
<p>Mostre como otimizar e melhorar o resultado.</p>
<h3>Dicas Extras</h3>
<ul><li>Dica 1</li><li>Dica 2</li></ul>
<h2>Próximos Passos</h2>
<p>Sugira aprofundamentos e recursos adicionais.</p>`,
  },
};

export default function BlogEditorPage() {
  const { toast } = useToast();
  const { session } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const insertLink = useCallback(() => {
    const url = prompt('URL do link:');
    if (url) execCommand('createLink', url);
  }, [execCommand]);

  const insertImage = useCallback(() => {
    const url = prompt('URL da imagem:');
    if (url) execCommand('insertImage', url);
  }, [execCommand]);

  const applyTemplate = (key: string) => {
    setSelectedTemplate(key);
    if (editorRef.current) {
      editorRef.current.innerHTML = SEO_TEMPLATES[key].html;
    }
  };

  const generateWithAI = async () => {
    if (!title.trim()) {
      toast({ title: 'Insira um título', description: 'O título é necessário para gerar conteúdo com IA.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const res = await supabase.functions.invoke('generate-content', {
        body: { type: 'text', prompt: `Escreva um artigo de blog completo e otimizado para SEO sobre: "${title}". Formato HTML com headings h2/h3, parágrafos, listas. Idioma: Português BR. Mínimo 800 palavras.` },
      });

      if (res.error) throw res.error;

      // Handle streaming response
      const reader = res.data?.getReader?.();
      if (reader) {
        let content = '';
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((l: string) => l.startsWith('data: '));
          for (const line of lines) {
            const data = line.replace('data: ', '');
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              content += parsed.choices?.[0]?.delta?.content || '';
            } catch { /* skip */ }
          }
        }
        if (editorRef.current) editorRef.current.innerHTML = content;
      } else if (typeof res.data === 'string') {
        if (editorRef.current) editorRef.current.innerHTML = res.data;
      }

      toast({ title: 'Conteúdo gerado!', description: 'Revise e edite antes de publicar.' });
    } catch (e: any) {
      toast({ title: 'Erro ao gerar', description: e.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const publishToWordPress = async (status: 'draft' | 'publish') => {
    if (!title.trim() || !editorRef.current?.innerHTML.trim()) {
      toast({ title: 'Preencha título e conteúdo', variant: 'destructive' });
      return;
    }
    setPublishing(true);
    try {
      const res = await supabase.functions.invoke('publish-wordpress', {
        body: {
          title,
          content: editorRef.current.innerHTML,
          tags,
          status,
        },
      });

      if (res.error) throw res.error;
      const data = res.data;

      if (data?.success) {
        toast({
          title: status === 'publish' ? 'Publicado!' : 'Rascunho salvo!',
          description: data.post_url ? `URL: ${data.post_url}` : 'Post enviado ao WordPress.',
        });
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (e: any) {
      toast({ title: 'Erro ao publicar', description: e.message || 'Verifique a conexão com WordPress.', variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <Helmet><title>Blog Engine — Magic Constellation</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Blog Engine</h1>
          <p className="text-muted-foreground">Crie artigos otimizados para SEO e publique direto no WordPress.</p>
        </div>

        {/* Templates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" /> Templates SEO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SEO_TEMPLATES).map(([key, tpl]) => (
                <Button
                  key={key}
                  variant={selectedTemplate === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => applyTemplate(key)}
                >
                  <span className="mr-1">{tpl.icon}</span> {tpl.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Título do artigo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold"
            />

            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 rounded-md border bg-muted/30">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => execCommand('bold')}>
                <Bold className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => execCommand('italic')}>
                <Italic className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => execCommand('formatBlock', 'h2')}>
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => execCommand('formatBlock', 'h3')}>
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => execCommand('insertUnorderedList')}>
                <List className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => execCommand('insertOrderedList')}>
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={insertLink}>
                <Link className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={insertImage}>
                <Image className="h-4 w-4" />
              </Button>
            </div>

            {/* Content editable */}
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[400px] p-4 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 prose prose-sm dark:prose-invert max-w-none"
              style={{ whiteSpace: 'pre-wrap' }}
            />

            <Input
              placeholder="Tags (separadas por vírgula)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={generateWithAI} disabled={generating} variant="outline">
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Gerar com IA
          </Button>
          <Button onClick={() => publishToWordPress('draft')} disabled={publishing} variant="secondary">
            <FileText className="mr-2 h-4 w-4" />
            Salvar Rascunho
          </Button>
          <Button onClick={() => publishToWordPress('publish')} disabled={publishing}>
            {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Publicar no WordPress
          </Button>
        </div>
      </div>
    </>
  );
}
