import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Calendar as CalendarIcon, Gift } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export default function SecretSantaSetup() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [minValue, setMinValue] = useState<number>(0);
  const [maxValue, setMaxValue] = useState<number>(0);
  const [drawDate, setDrawDate] = useState<Date>();
  const [preventRepeat, setPreventRepeat] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateSecretSanta = async () => {
    if (!eventId) return;
    
    if (minValue < 0 || maxValue < 0) {
      toast({
        title: "Valores inválidos",
        description: "Os valores mínimo e máximo devem ser positivos.",
        variant: "destructive",
      });
      return;
    }

    if (maxValue > 0 && minValue > maxValue) {
      toast({
        title: "Valores inválidos",
        description: "O valor mínimo não pode ser maior que o valor máximo.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Primeiro, criar a dinâmica
      const { data: dynamicData, error: dynamicError } = await supabase
        .from("event_dynamics")
        .insert({
          event_id: Number(eventId),
          type: "secret_santa",
        })
        .select()
        .single();

      if (dynamicError) throw dynamicError;

      // Criar configuração do Amigo Secreto
      const { error: secretSantaError } = await supabase
        .from("event_secret_santa")
        .insert({
          event_id: Number(eventId),
          min_value: minValue || null,
          max_value: maxValue || null,
          draw_date: drawDate ? drawDate.toISOString() : null,
          rules_json: { prevent_repeat: preventRepeat },
        });

      if (secretSantaError) throw secretSantaError;

      toast({
        title: "Amigo Secreto criado!",
        description: "Configure agora os participantes.",
      });

      navigate(`/event/${eventId}/secret-santa/participants`);
    } catch (err: any) {
      console.error("Erro ao criar Amigo Secreto:", err);
      toast({
        title: "Erro ao criar",
        description: err.message || "Não foi possível criar o Amigo Secreto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/app?event=${eventId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para o evento
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Configurar Amigo Secreto</CardTitle>
                <CardDescription>
                  Defina as regras para o Amigo Secreto do evento
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minValue">Valor Mínimo (R$)</Label>
                <Input
                  id="minValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={minValue || ""}
                  onChange={(e) => setMinValue(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxValue">Valor Máximo (R$)</Label>
                <Input
                  id="maxValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxValue || ""}
                  onChange={(e) => setMaxValue(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data do Sorteio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !drawDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {drawDate ? format(drawDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={drawDate}
                    onSelect={setDrawDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center justify-between space-x-2 p-4 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="preventRepeat">Impedir repetições</Label>
                <p className="text-sm text-muted-foreground">
                  Participantes não podem sortear a mesma pessoa em sorteios futuros
                </p>
              </div>
              <Switch
                id="preventRepeat"
                checked={preventRepeat}
                onCheckedChange={setPreventRepeat}
              />
            </div>

            <Button
              onClick={handleCreateSecretSanta}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Criando..." : "Criar Amigo Secreto"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
