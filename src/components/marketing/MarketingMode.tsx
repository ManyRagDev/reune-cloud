import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import html2canvas from "html2canvas";

interface MarketingModeProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export const MarketingMode = ({ isEnabled, onToggle }: MarketingModeProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();

  const captureScreenshot = async (format: 'feed' | 'story' | 'linkedin') => {
    setIsCapturing(true);
    try {
      const dimensions = {
        feed: { width: 1080, height: 1350 },
        story: { width: 1080, height: 1920 },
        linkedin: { width: 1200, height: 627 }
      };

      const dim = dimensions[format];
      const scale = dim.width / window.innerWidth;

      const canvas = await html2canvas(document.body, {
        width: window.innerWidth,
        height: window.innerHeight,
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: null
      });

      // Crop to exact dimensions
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = dim.width;
      croppedCanvas.height = dim.height;
      const ctx = croppedCanvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(
          canvas,
          0, 0, canvas.width, canvas.height,
          0, 0, dim.width, dim.height
        );
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
      });

      // Upload to Supabase Storage
      const timestamp = new Date().getTime();
      const fileName = `screenshot-${format}-${timestamp}.png`;
      const filePath = `marketing/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filePath, blob, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('screenshots')
        .getPublicUrl(filePath);

      // Download locally as well
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Screenshot capturado!",
        description: `Formato ${format} salvo no storage e baixado localmente.`
      });

    } catch (error) {
      console.error('Erro ao capturar screenshot:', error);
      toast({
        title: "Erro ao capturar",
        description: "Não foi possível capturar o screenshot.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">📸 Modo Marketing</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-6 w-6 p-0"
        >
          ✕
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          onClick={() => captureScreenshot('feed')}
          disabled={isCapturing}
          size="sm"
          variant="outline"
          className="justify-start"
        >
          {isCapturing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Camera className="w-4 h-4 mr-2" />
          )}
          Feed (1080x1350)
        </Button>

        <Button
          onClick={() => captureScreenshot('story')}
          disabled={isCapturing}
          size="sm"
          variant="outline"
          className="justify-start"
        >
          {isCapturing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Camera className="w-4 h-4 mr-2" />
          )}
          Story (1080x1920)
        </Button>

        <Button
          onClick={() => captureScreenshot('linkedin')}
          disabled={isCapturing}
          size="sm"
          variant="outline"
          className="justify-start"
        >
          {isCapturing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Camera className="w-4 h-4 mr-2" />
          )}
          LinkedIn (1200x627)
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Screenshots salvos no storage e baixados localmente
      </p>
    </div>
  );
};
