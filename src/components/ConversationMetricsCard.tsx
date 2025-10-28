import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useConversationMetrics } from '@/hooks/useConversationMetrics';
import { TrendingUp, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Componente para exibir métricas de performance do UNE.AI
 * (Opcional - pode ser usado em dashboard ou configurações)
 */
export function ConversationMetricsCard() {
  const { metrics, loading } = useConversationMetrics();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Métricas de Conversação
        </CardTitle>
        <CardDescription>
          Performance do assistente UNE.AI nas suas interações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo Geral */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              <span>Total de Interações</span>
            </div>
            <div className="text-2xl font-bold">{metrics.summary.total_interactions}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              <span>Taxa de Sucesso</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics.summary.success_rate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Confiança Média */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Confiança Média</span>
            <span className="font-medium">
              {(metrics.summary.avg_confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${metrics.summary.avg_confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Feedback do Usuário */}
        {metrics.feedback.total > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <div className="text-sm font-medium">Feedback do Usuário</div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-600">👍</span>
                <span>{metrics.feedback.positive}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600">👎</span>
                <span>{metrics.feedback.negative}</span>
              </div>
            </div>
          </div>
        )}

        {/* Erros Frequentes */}
        {metrics.frequent_errors.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Padrões de Melhoria</span>
            </div>
            <div className="space-y-1 text-sm">
              {metrics.frequent_errors.slice(0, 3).map((error, idx) => (
                <div key={idx} className="flex justify-between items-center text-muted-foreground">
                  <span className="capitalize">{error.intent.replace(/_/g, ' ')}</span>
                  <span>{error.error_count} correções</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
