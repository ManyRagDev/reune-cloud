import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { mockupTemplates, formatLabels, type MockupFormat } from '@/data/mockupTemplates';

export default function MockupGenerator() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState('heroLaunch');
  const [selectedFormat, setSelectedFormat] = useState<MockupFormat>('feed');
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentTemplate = mockupTemplates[selectedTemplate];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-mockup', {
        body: {
          mockupType: selectedTemplate,
          format: selectedFormat,
          customTexts: {
            ...currentTemplate.defaultTexts,
            ...customTexts
          }
        }
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error === 'rate_limit') {
          toast({
            title: 'Limite de requisições',
            description: 'Aguarde alguns segundos e tente novamente.',
            variant: 'destructive'
          });
          return;
        }
        if (data.error === 'payment_required') {
          toast({
            title: 'Créditos esgotados',
            description: 'Entre em contato com o suporte para adicionar créditos.',
            variant: 'destructive'
          });
          return;
        }
        throw new Error(data.message || 'Erro ao gerar mockup');
      }

      setGeneratedImage(data.imageBase64);
      toast({
        title: 'Mockup gerado!',
        description: 'Clique em "Download" para salvar a imagem.',
      });

    } catch (error) {
      console.error('Erro ao gerar mockup:', error);
      toast({
        title: 'Erro ao gerar mockup',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `reune-mockup-${selectedTemplate}-${selectedFormat}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Download iniciado',
      description: 'Mockup salvo com sucesso!'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Gerador de Mockups ReUNE
          </h1>
          <p className="text-muted-foreground">
            Crie mockups profissionais para redes sociais em segundos
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Painel de Configuração */}
          <Card className="p-6 space-y-6">
            <div>
              <Label className="text-lg font-semibold mb-3 block">Tipo de Mockup</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(mockupTemplates).map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                {currentTemplate.description}
              </p>
            </div>

            <div>
              <Label className="text-lg font-semibold mb-3 block">Formato</Label>
              <Select 
                value={selectedFormat} 
                onValueChange={(value) => setSelectedFormat(value as MockupFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentTemplate.formats.map(format => (
                    <SelectItem key={format} value={format}>
                      {formatLabels[format]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold block">Personalizar Textos</Label>
              
              {currentTemplate.defaultTexts.headline !== undefined && (
                <div>
                  <Label htmlFor="headline" className="text-sm">Título Principal</Label>
                  <Input
                    id="headline"
                    placeholder={currentTemplate.defaultTexts.headline}
                    value={customTexts.headline || ''}
                    onChange={(e) => setCustomTexts(prev => ({ ...prev, headline: e.target.value }))}
                  />
                </div>
              )}

              {currentTemplate.defaultTexts.subheadline !== undefined && (
                <div>
                  <Label htmlFor="subheadline" className="text-sm">Subtítulo</Label>
                  <Input
                    id="subheadline"
                    placeholder={currentTemplate.defaultTexts.subheadline}
                    value={customTexts.subheadline || ''}
                    onChange={(e) => setCustomTexts(prev => ({ ...prev, subheadline: e.target.value }))}
                  />
                </div>
              )}

              {currentTemplate.defaultTexts.featureTitle !== undefined && (
                <div>
                  <Label htmlFor="featureTitle" className="text-sm">Título da Feature</Label>
                  <Input
                    id="featureTitle"
                    placeholder={currentTemplate.defaultTexts.featureTitle}
                    value={customTexts.featureTitle || ''}
                    onChange={(e) => setCustomTexts(prev => ({ ...prev, featureTitle: e.target.value }))}
                  />
                </div>
              )}

              {currentTemplate.defaultTexts.daysRemaining !== undefined && (
                <div>
                  <Label htmlFor="daysRemaining" className="text-sm">Dias Restantes</Label>
                  <Input
                    id="daysRemaining"
                    type="number"
                    placeholder={currentTemplate.defaultTexts.daysRemaining}
                    value={customTexts.daysRemaining || ''}
                    onChange={(e) => setCustomTexts(prev => ({ ...prev, daysRemaining: e.target.value }))}
                  />
                </div>
              )}

              {currentTemplate.defaultTexts.problemText !== undefined && (
                <div>
                  <Label htmlFor="problemText" className="text-sm">Texto do Problema</Label>
                  <Textarea
                    id="problemText"
                    placeholder={currentTemplate.defaultTexts.problemText}
                    value={customTexts.problemText || ''}
                    onChange={(e) => setCustomTexts(prev => ({ ...prev, problemText: e.target.value }))}
                  />
                </div>
              )}

              {currentTemplate.defaultTexts.solutionText !== undefined && (
                <div>
                  <Label htmlFor="solutionText" className="text-sm">Texto da Solução</Label>
                  <Textarea
                    id="solutionText"
                    placeholder={currentTemplate.defaultTexts.solutionText}
                    value={customTexts.solutionText || ''}
                    onChange={(e) => setCustomTexts(prev => ({ ...prev, solutionText: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gerando... (pode levar 10-20s)
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Gerar Mockup
                </>
              )}
            </Button>
          </Card>

          {/* Painel de Preview */}
          <Card className="p-6">
            <Label className="text-lg font-semibold mb-4 block">Preview</Label>
            
            <div className="bg-muted/30 rounded-lg min-h-[500px] flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
              {isGenerating ? (
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">
                    Gerando seu mockup...
                    <br />
                    <span className="text-sm">Isso pode levar de 10 a 20 segundos</span>
                  </p>
                </div>
              ) : generatedImage ? (
                <div className="space-y-4 w-full">
                  <img 
                    src={generatedImage} 
                    alt="Mockup gerado" 
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <Button 
                    onClick={handleDownload}
                    className="w-full"
                    variant="default"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Configure e clique em "Gerar Mockup"
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
