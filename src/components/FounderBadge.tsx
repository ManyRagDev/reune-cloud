import { Trophy, Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FounderBadgeProps {
  variant?: "default" | "compact" | "full";
  founderSince?: string;
  premiumUntil?: string;
  storageMultiplier?: number;
}

export function FounderBadge({
  variant = "default",
  founderSince,
  premiumUntil,
  storageMultiplier = 3,
}: FounderBadgeProps) {
  const isPremiumActive = premiumUntil && new Date(premiumUntil) >= new Date();

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant="outline"
              className="bg-gradient-to-r from-amber-500/10 to-purple-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:from-amber-500/20 hover:to-purple-500/20 transition-all cursor-help"
            >
              <Trophy className="w-3 h-3 mr-1" />
              Fundador
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-1">
                <Trophy className="w-4 h-4 text-amber-500" />
                Membro Fundador
              </p>
              <p className="text-xs text-muted-foreground">
                Você faz parte dos primeiros membros do ReUNE!
              </p>
              <div className="space-y-1 text-xs">
                <p className="flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Premium: {isPremiumActive ? `Até ${new Date(premiumUntil).toLocaleDateString('pt-BR')}` : 'Expirado'}
                </p>
                <p className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Limites: {storageMultiplier}x maiores
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "full") {
    return (
      <div className="bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-pink-500/10 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-purple-600 rounded-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              Membro Fundador
              <Badge variant="outline" className="text-xs border-amber-500/30 bg-amber-500/5">
                Exclusivo
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Você faz parte da primeira geração do ReUNE!
            </p>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {isPremiumActive ? (
                    <>Premium grátis até <strong>{new Date(premiumUntil).toLocaleDateString('pt-BR')}</strong></>
                  ) : (
                    'Premium expirado'
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Limites <strong>{storageMultiplier}x maiores</strong> permanentemente</span>
              </div>
            </div>

            {founderSince && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                Membro desde {new Date(founderSince).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Variant "default"
  return (
    <Badge
      variant="outline"
      className="bg-gradient-to-r from-amber-500/10 to-purple-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 px-3 py-1"
    >
      <Trophy className="w-3.5 h-3.5 mr-1.5" />
      Membro Fundador
    </Badge>
  );
}
