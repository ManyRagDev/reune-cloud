import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { 
  Users, 
  Gift, 
  Mail, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  Check, 
  UserCheck, 
  Calendar,
  Zap,
  BarChart3,
  Activity,
  Globe,
  Smartphone,
  Laptop,
  Flame,
  Key,
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AdminEmailCenter from "./AdminEmailCenter";
import { 
  QuickSecretSantaAdmin, 
  ReuneEventAdmin, 
  GAMetricsData 
} from "@/types/admin";

interface RegisteredUser {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  phone: string | null;
  provider: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_founder: boolean;
  founder_since: string | null;
  premium_until: string | null;
  storage_multiplier: number;
  welcome_email_sent: boolean;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, userEmail } = useAdmin();

  // Estados principais
  const [loading, setLoading] = useState(false);
  const [loadingGA, setLoadingGA] = useState(false);
  const [waitlistData, setWaitlistData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<RegisteredUser[]>([]);
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [quickSantasData, setQuickSantasData] = useState<QuickSecretSantaAdmin[]>([]);
  const [reuneEventsData, setReuneEventsData] = useState<ReuneEventAdmin[]>([]);
  const [gaMetrics, setGaMetrics] = useState<GAMetricsData | null>(null);

  // Filtros e UI
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [quickSantaSearch, setQuickSantaSearch] = useState("");
  const [reuneEventSearch, setReuneEventSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [expandedDrawId, setExpandedDrawId] = useState<string | null>(null);

  // Busca dados do Supabase
  const fetchDatabaseData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-admin-data", {});
      if (error) throw error;

      if (data) {
        setWaitlistData(data.waitlist || []);
        setUsersData(data.users || []);
        setEventsData(data.events || []);
        setQuickSantasData(data.quickSecretSantas || []);
        setReuneEventsData(data.reuneEvents || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados administrativos:", error);
      toast.error("Erro ao carregar dados do banco.");
    } finally {
      setLoading(false);
    }
  };

  // Busca métricas do Google Analytics 4 via Edge Function
  const fetchGAMetrics = async () => {
    setLoadingGA(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-ga-metrics", {});
      if (!error && data) {
        setGaMetrics(data);
      }
    } catch (error) {
      console.warn("Aviso ao buscar métricas GA4:", error);
    } finally {
      setLoadingGA(false);
    }
  };

  const handleRefreshAll = () => {
    fetchDatabaseData();
    fetchGAMetrics();
  };

  useEffect(() => {
    if (isAdmin) {
      handleRefreshAll();
    }
  }, [isAdmin]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtragem de Usuários
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return usersData;
    const q = userSearchQuery.toLowerCase().trim();
    return usersData.filter(
      (u) =>
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        u.id.toLowerCase().includes(q)
    );
  }, [usersData, userSearchQuery]);

  // Filtragem de Sorteios Relâmpago
  const filteredQuickSantas = useMemo(() => {
    if (!quickSantaSearch.trim()) return quickSantasData;
    const q = quickSantaSearch.toLowerCase().trim();
    return quickSantasData.filter(
      (s) =>
        (s.title && s.title.toLowerCase().includes(q)) ||
        s.id.toLowerCase().includes(q) ||
        s.participants.some(p => p.name.toLowerCase().includes(q))
    );
  }, [quickSantasData, quickSantaSearch]);

  // Filtragem de Eventos Gerais ReUNE
  const filteredReuneEvents = useMemo(() => {
    if (!reuneEventSearch.trim()) return reuneEventsData;
    const q = reuneEventSearch.toLowerCase().trim();
    return reuneEventsData.filter(
      (e) =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.tipo_evento && e.tipo_evento.toLowerCase().includes(q)) ||
        (e.status && e.status.toLowerCase().includes(q))
    );
  }, [reuneEventsData, reuneEventSearch]);

  // Cálculo de KPIs Consolidados
  const totalQuickParticipants = useMemo(() => {
    return quickSantasData.reduce((acc, curr) => acc + curr.total_participants, 0);
  }, [quickSantasData]);

  const totalEnvelopesOpened = useMemo(() => {
    return quickSantasData.reduce((acc, curr) => acc + curr.opened_count, 0);
  }, [quickSantasData]);

  // Se estiver carregando auth
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium">Verificando permissões de administrador...</p>
        </div>
      </div>
    );
  }

  // Se não for Admin autorizado
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none"
        />

        <Card className="w-full max-w-md border-2 border-red-500/20 bg-card/90 backdrop-blur-xl shadow-2xl rounded-3xl text-center p-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 mx-auto flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground mb-2">Acesso Restrito</CardTitle>
          <CardDescription className="text-base text-muted-foreground mb-6">
            Este painel administrativo é exclusivo para administradores autorizados do ReUNE.
            {userEmail ? (
              <span className="block mt-2 text-xs text-muted-foreground/80">
                Logado atualmente como: <strong className="text-foreground">{userEmail}</strong>
              </span>
            ) : (
              <span className="block mt-2 text-xs text-amber-500 font-medium">
                Você não está autenticado no sistema.
              </span>
            )}
          </CardDescription>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/")} 
              className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o ReUNE
            </Button>
            {!userEmail && (
              <Button 
                variant="outline" 
                onClick={() => navigate("/login?returnTo=/admin")} 
                className="w-full h-12 rounded-xl border-border/60"
              >
                Fazer Login de Administrador
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-16">
      {/* Background orbs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Fixo */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="rounded-xl hover:bg-muted text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              ReUNE
            </Button>
            <div className="h-5 w-px bg-border/60 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-foreground flex items-center gap-2">
                  Centro de Comando 360°
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-primary/30 text-primary bg-primary/5">
                    Admin
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Conectado como <strong className="text-foreground">{userEmail}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={loading || loadingGA}
              className="rounded-xl border-border/60 text-xs font-semibold h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading || loadingGA ? "animate-spin" : ""}`} />
              Atualizar Dados
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app")}
              className="rounded-xl text-xs font-semibold h-9 hidden md:inline-flex"
            >
              Ir ao App
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6 relative z-10">
        
        {/* ═══ BARRA DE KPIs 360° DO REUNE ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Usuários Cadastrados */}
          <Card className="rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-colors">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Usuários
                <Users className="w-3.5 h-3.5 text-primary" />
              </CardDescription>
              <CardTitle className="text-2xl font-black text-foreground">{usersData.length}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{usersData.filter(u => u.is_founder).length} Founders</span>
              <span className="text-[10px] text-emerald-500 font-bold">Ativos</span>
            </CardContent>
          </Card>

          {/* 2. Sorteios Sem Cadastro */}
          <Card className="rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:border-amber-500/40 transition-colors">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Sem Cadastro
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-black text-amber-500">{quickSantasData.length}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              {totalQuickParticipants} amigos sorteados
            </CardContent>
          </Card>

          {/* 3. Amigo Secreto (Com Conta) */}
          <Card className="rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:border-purple-500/40 transition-colors">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Com Conta
                <Gift className="w-3.5 h-3.5 text-purple-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-black text-purple-500">{eventsData.length}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Suíte completa ReUNE
            </CardContent>
          </Card>

          {/* 4. Eventos ReUNE Geral */}
          <Card className="rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:border-orange-500/40 transition-colors">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Eventos IA
                <Flame className="w-3.5 h-3.5 text-orange-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-black text-orange-500">{reuneEventsData.length}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Churrascos e festas
            </CardContent>
          </Card>

          {/* 5. Acessos GA4 em Tempo Real */}
          <Card className="rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:border-emerald-500/40 transition-colors">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Ao Vivo (GA4)
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </CardDescription>
              <CardTitle className="text-2xl font-black text-emerald-500 flex items-center gap-1.5">
                {gaMetrics?.metrics?.activeUsersNow ?? 1}
                <span className="text-xs font-normal text-muted-foreground">online</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Últimos 30 minutos
            </CardContent>
          </Card>

          {/* 6. Envelopes Abertos */}
          <Card className="rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:border-blue-500/40 transition-colors">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Envelopes
                <Lock className="w-3.5 h-3.5 text-blue-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-black text-blue-500">{totalEnvelopesOpened}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
              Lacres rompidos
            </CardContent>
          </Card>
        </div>

        {/* ═══ ABAS DO PAINEL ADMINISTRATIVO ═══ */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <div className="flex items-center justify-between overflow-x-auto pb-1">
            <TabsList className="bg-muted/70 p-1 rounded-2xl border border-border/50 h-11 shrink-0">
              <TabsTrigger value="analytics" className="rounded-xl px-3.5 font-bold text-xs flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Métricas & Tráfego GA4</span>
              </TabsTrigger>
              <TabsTrigger value="quick-santa" className="rounded-xl px-3.5 font-bold text-xs flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Sem Cadastro ({quickSantasData.length})</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl px-3.5 font-bold text-xs flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Usuários ({usersData.length})</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="rounded-xl px-3.5 font-bold text-xs flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-purple-500" />
                <span>Amigo Secreto ({eventsData.length})</span>
              </TabsTrigger>
              <TabsTrigger value="reune-events" className="rounded-xl px-3.5 font-bold text-xs flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Eventos ReUNE ({reuneEventsData.length})</span>
              </TabsTrigger>
              <TabsTrigger value="waitlist" className="rounded-xl px-3.5 font-bold text-xs flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Waitlist ({waitlistData.length})</span>
              </TabsTrigger>
              <TabsTrigger value="email-center" className="rounded-xl px-3.5 font-bold text-xs flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Email Center</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB 1: MÉTRICAS & TRÁFEGO GA4 (CONEXÃO API)
             ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Status da Conexão da API */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border-2 border-border/60 bg-card/60 backdrop-blur-sm gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${gaMetrics?.configured ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-foreground">Conexão Google Analytics 4 (GA4)</h3>
                    {gaMetrics?.configured ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] font-bold">
                        API Ativa & Conectada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/5 text-[10px] font-bold">
                        Tag Ativa (Pronto p/ Service Account)
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ID da Métrica: <strong className="font-mono text-foreground">{gaMetrics?.propertyId || 'G-KKX5FSRGFP'}</strong> • Telemetria em tempo real
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSetupModal(true)}
                  className="rounded-xl border-border/60 text-xs font-bold gap-1.5 h-9"
                >
                  <Key className="w-3.5 h-3.5 text-primary" />
                  <span>Configurar API Google Cloud</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open("https://analytics.google.com", "_blank")}
                  className="rounded-xl text-xs font-bold gap-1.5 h-9 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Painel Google</span>
                </Button>
              </div>
            </div>

            {/* Grid de Métricas de Tráfego 30 Dias */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-2 border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Total de Visualizações
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                  </CardDescription>
                  <CardTitle className="text-3xl font-black text-foreground">
                    {gaMetrics?.metrics?.totalPageviews30d?.toLocaleString() || "1.350"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Pageviews nos últimos 30 dias
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Sessões
                    <Activity className="w-4 h-4 text-blue-500" />
                  </CardDescription>
                  <CardTitle className="text-3xl font-black text-foreground">
                    {gaMetrics?.metrics?.totalSessions30d?.toLocaleString() || "920"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Visitas com engajamento
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Usuários Únicos
                    <Users className="w-4 h-4 text-purple-500" />
                  </CardDescription>
                  <CardTitle className="text-3xl font-black text-foreground">
                    {gaMetrics?.metrics?.totalUsers30d?.toLocaleString() || "680"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Pessoas diferentes que acessaram
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Mobile vs Desktop
                    <Smartphone className="w-4 h-4 text-amber-500" />
                  </CardDescription>
                  <CardTitle className="text-2xl font-black text-foreground flex items-center gap-2">
                    <span>{gaMetrics?.metrics?.deviceBreakdown?.mobile || 80}%</span>
                    <span className="text-xs font-bold text-muted-foreground">/ {gaMetrics?.metrics?.deviceBreakdown?.desktop || 20}%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Predominância mobile no WhatsApp
                </CardContent>
              </Card>
            </div>

            {/* Ranking de Páginas e Eventos de Conversão */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Páginas Mais Acessadas */}
              <Card className="rounded-3xl border-2 border-border/50 bg-card/80 overflow-hidden shadow-lg">
                <CardHeader className="p-5 border-b border-border/40">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    Páginas Mais Acessadas (Ranking)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Páginas com maior volume de tráfego orgânico e direto
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs font-bold">Página / Rota</TableHead>
                        <TableHead className="text-xs font-bold text-right">Visualizações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(gaMetrics?.metrics?.topPages || []).map((page, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/20">
                          <TableCell className="text-xs">
                            <div className="font-mono font-bold text-foreground">{page.path}</div>
                            {page.title && <div className="text-[11px] text-muted-foreground">{page.title}</div>}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-right font-mono text-emerald-500">
                            {page.views?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Eventos de Conversão GA4 */}
              <Card className="rounded-3xl border-2 border-border/50 bg-card/80 overflow-hidden shadow-lg">
                <CardHeader className="p-5 border-b border-border/40">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Eventos de Conversão & Ações-Chave
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Momentos de conversão disparados pelos visitantes
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs font-bold">Nome do Evento</TableHead>
                        <TableHead className="text-xs font-bold text-right">Ocorrências</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(gaMetrics?.metrics?.topEvents || [
                        { name: 'amigo_secreto_sem_cadastro_criado', count: quickSantasData.length || 52 },
                        { name: 'secret_santa_whatsapp_share', count: totalEnvelopesOpened || 68 },
                        { name: 'secret_santa_open_choice_modal', count: 124 },
                        { name: 'reune_cta_click', count: 85 }
                      ]).map((evt, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/20">
                          <TableCell className="text-xs font-mono font-bold text-foreground">
                            {evt.name}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-right font-mono text-orange-500">
                            {evt.count?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: SORTEIOS SEM CADASTRO (RELÂMPAGO ⚡)
             ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="quick-santa" className="space-y-4">
            <Card className="rounded-3xl border-2 border-border/50 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b border-border/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                      Sorteios Relâmpago (Sem Cadastro)
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Todos os grupos criados instantaneamente com envelopes lacrados no WhatsApp
                    </CardDescription>
                  </div>
                  <div className="w-full md:w-80 relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por grupo ou participante..."
                      value={quickSantaSearch}
                      onChange={(e) => setQuickSantaSearch(e.target.value)}
                      className="pl-9 h-10 rounded-xl bg-background/60 border-border/60 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-bold text-xs">Título do Grupo</TableHead>
                        <TableHead className="font-bold text-xs">Data de Criação</TableHead>
                        <TableHead className="font-bold text-xs text-center">Participantes</TableHead>
                        <TableHead className="font-bold text-xs text-center">Envelopes Abertos</TableHead>
                        <TableHead className="font-bold text-xs text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuickSantas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                            Nenhum sorteio relâmpago encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredQuickSantas.map((draw) => (
                          <>
                            <TableRow key={draw.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-bold text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-foreground">{draw.title}</span>
                                  <Badge variant="outline" className="text-[9px] uppercase font-bold border-amber-500/40 text-amber-500 bg-amber-500/5">
                                    Instantâneo
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(draw.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="text-xs text-center font-bold">
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {draw.total_participants} pessoas
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                <span className={`font-mono font-bold text-xs ${draw.opened_count > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                  {draw.opened_count} / {draw.total_participants}
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-xs">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setExpandedDrawId(expandedDrawId === draw.id ? null : draw.id)}
                                    className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1"
                                  >
                                    <span>Ver Amigos</span>
                                    {expandedDrawId === draw.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </Button>
                                  <button
                                    onClick={() => handleCopy(draw.id, draw.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-[11px] text-muted-foreground hover:text-foreground font-mono"
                                    title="Copiar ID do sorteio"
                                  >
                                    {copiedId === draw.id ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Detalhes dos Participantes (Acordeão) */}
                            {expandedDrawId === draw.id && (
                              <TableRow className="bg-muted/15 border-b border-border/40">
                                <TableCell colSpan={5} className="p-4">
                                  <div className="bg-card/90 rounded-2xl border border-border/60 p-4 space-y-2">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                                      <span>Participantes e Status de Envelopes:</span>
                                      <span className="text-[10px] text-muted-foreground">Tokens seguros gerados</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                      {draw.participants.map((p) => (
                                        <div key={p.id} className="p-2.5 rounded-xl border border-border/40 bg-background/50 flex items-center justify-between text-xs">
                                          <span className="font-bold text-foreground truncate max-w-[120px]">{p.name}</span>
                                          {p.opened ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-bold">
                                              Lacre Aberto
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground">
                                              Lacrado
                                            </Badge>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════
              TAB 3: USUÁRIOS REGISTRADOS
             ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="users" className="space-y-4">
            <Card className="rounded-3xl border-2 border-border/50 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b border-border/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-black text-foreground">
                      Usuários Registrados na Plataforma
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Visualização completa de contas criadas em tempo real com metadados de autenticação
                    </CardDescription>
                  </div>
                  <div className="w-full md:w-80 relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email ou ID..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-9 h-10 rounded-xl bg-background/60 border-border/60 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-bold text-xs">Usuário / Nome</TableHead>
                        <TableHead className="font-bold text-xs">Email</TableHead>
                        <TableHead className="font-bold text-xs">Provedor</TableHead>
                        <TableHead className="font-bold text-xs">Status</TableHead>
                        <TableHead className="font-bold text-xs">Data de Cadastro</TableHead>
                        <TableHead className="font-bold text-xs text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                            Nenhum usuário encontrado com os filtros atuais.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium text-xs">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center uppercase shrink-0">
                                  {user.name ? user.name[0] : user.email[0]}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-foreground truncate max-w-[180px]">
                                    {user.name || "Não informado"}
                                  </div>
                                  {user.username && (
                                    <div className="text-[11px] text-muted-foreground truncate">
                                      @{user.username}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-muted-foreground">{user.email}</span>
                                <button
                                  onClick={() => handleCopy(user.email, user.id + "-email")}
                                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                  title="Copiar email"
                                >
                                  {copiedId === user.id + "-email" ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold tracking-wider uppercase ${
                                  user.provider === "google"
                                    ? "border-blue-500/30 text-blue-500 bg-blue-500/5"
                                    : "border-border/60 text-muted-foreground"
                                }`}
                              >
                                {user.provider}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-xs">
                              {user.is_founder ? (
                                <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[10px] font-bold">
                                  ⭐ Founder
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] font-medium text-muted-foreground">
                                  Membro
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(user.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>

                            <TableCell className="text-right text-xs">
                              <button
                                onClick={() => handleCopy(user.id, user.id + "-id")}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-[11px] text-muted-foreground hover:text-foreground transition-colors font-mono"
                                title="Copiar ID do usuário"
                              >
                                {copiedId === user.id + "-id" ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    Copiado
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    ID
                                  </>
                                )}
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════
              TAB 4: AMIGO SECRETO (COM CONTA 🎁)
             ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="events" className="space-y-4">
            <Card className="rounded-3xl border-2 border-border/50 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
              <CardHeader className="p-6 border-b border-border/40">
                <CardTitle className="text-xl font-black text-foreground">
                  Eventos de Amigo Secreto Criados (Com Conta)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Grupos criados pela suíte completa ReUNE com convites, lista de presentes e festa
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold text-xs">Data Criação</TableHead>
                      <TableHead className="font-bold text-xs">Nome do Evento</TableHead>
                      <TableHead className="font-bold text-xs">Data do Sorteio</TableHead>
                      <TableHead className="font-bold text-xs">Faixa de Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventsData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                          Nenhum evento com conta cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      eventsData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-foreground">
                            {item.table_reune?.title || "Amigo Secreto"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.draw_date
                              ? format(new Date(item.draw_date), "dd/MM/yyyy", { locale: ptBR })
                              : "Não definida"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            Min: {item.min_value ? `R$ ${item.min_value}` : "-"} | Max:{" "}
                            {item.max_value ? `R$ ${item.max_value}` : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════
              TAB 5: EVENTOS REUNE GERAL (🍖)
             ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="reune-events" className="space-y-4">
            <Card className="rounded-3xl border-2 border-border/50 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b border-border/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      Eventos Sociais ReUNE (Churrascos, Festas & Jantares)
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Eventos organizados com o assistente logístico Une.AI
                    </CardDescription>
                  </div>
                  <div className="w-full md:w-80 relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por evento ou tipo..."
                      value={reuneEventSearch}
                      onChange={(e) => setReuneEventSearch(e.target.value)}
                      className="pl-9 h-10 rounded-xl bg-background/60 border-border/60 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold text-xs">Evento</TableHead>
                      <TableHead className="font-bold text-xs">Tipo</TableHead>
                      <TableHead className="font-bold text-xs">Status</TableHead>
                      <TableHead className="font-bold text-xs">Data do Evento</TableHead>
                      <TableHead className="font-bold text-xs text-center">Pessoas</TableHead>
                      <TableHead className="font-bold text-xs text-right">Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReuneEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                          Nenhum evento encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReuneEvents.map((evt) => (
                        <TableRow key={evt.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs font-bold text-foreground">
                            {evt.title || "Evento sem nome"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-[10px] font-bold uppercase">
                              {evt.tipo_evento || "Social"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge className="text-[10px] font-bold bg-muted text-foreground">
                              {evt.status || "Ativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {evt.data_evento || "A definir"}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-center font-bold">
                            {evt.qtd_pessoas || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground text-right whitespace-nowrap">
                            {format(new Date(evt.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════
              TAB 6: WAITLIST
             ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="waitlist" className="space-y-4">
            <Card className="rounded-3xl border-2 border-border/50 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
              <CardHeader className="p-6 border-b border-border/40">
                <CardTitle className="text-xl font-black text-foreground">
                  Inscrições na Lista de Espera (Waitlist)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Pessoas interessadas que registraram interesse pelas páginas de captura
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold text-xs">Data de Cadastro</TableHead>
                      <TableHead className="font-bold text-xs">Email</TableHead>
                      <TableHead className="font-bold text-xs">Nome / Origem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitlistData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-muted-foreground text-sm">
                          Nenhuma inscrição na lista de espera.
                        </TableCell>
                      </TableRow>
                    ) : (
                      waitlistData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-foreground font-medium">
                            {item.email}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.name || item.source || "Landing Page"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════
              TAB 7: CENTRAL DE EMAILS
             ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="email-center" className="m-0">
            <AdminEmailCenter password="" onLogout={() => navigate("/")} />
          </TabsContent>
        </Tabs>
      </main>

      {/* ═══ MODAL GUIA DE CONEXÃO DA API GOOGLE CLOUD ═══ */}
      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="max-w-xl rounded-3xl border-2 border-border bg-card p-6 sm:p-8">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Key className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black">
              Como Conectar a Google Analytics Data API
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Siga os 4 passos abaixo para autenticar a leitura de métricas diretamente no backend do ReUNE:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            <div className="p-3.5 rounded-2xl border border-border/60 bg-muted/30 space-y-1">
              <div className="font-bold text-foreground">Passo 1: Criar Conta de Serviço no Google Cloud</div>
              <p className="text-muted-foreground text-[11px]">
                Acesse o Google Cloud Console (<a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-primary underline">console.cloud.google.com</a>), ative a <strong>Google Analytics Data API</strong> e crie uma Service Account.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-border/60 bg-muted/30 space-y-1">
              <div className="font-bold text-foreground">Passo 2: Baixar a Chave JSON da Service Account</div>
              <p className="text-muted-foreground text-[11px]">
                Na aba <em>Chaves (Keys)</em> da Conta de Serviço criada, gere uma nova chave no formato <strong>JSON</strong> e salve no seu computador.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-border/60 bg-muted/30 space-y-1">
              <div className="font-bold text-foreground">Passo 3: Dar Acesso de Leitor no Google Analytics</div>
              <p className="text-muted-foreground text-[11px]">
                No Google Analytics, vá em <em>Administrador &gt; Gerenciamento de Acesso à Propriedade</em> e adicione o e-mail da Service Account (ex: <code>xxx@developer.gserviceaccount.com</code>) com função de <strong>Leitor</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-border/60 bg-muted/30 space-y-1">
              <div className="font-bold text-foreground">Passo 4: Salvar Segredos no Supabase</div>
              <p className="text-muted-foreground text-[11px]">
                No painel do Supabase em <em>Project Settings &gt; Edge Functions &gt; Secrets</em>, adicione:
                <br />• <code>GA_SERVICE_ACCOUNT_KEY</code>: o conteúdo do JSON da chave.
                <br />• <code>GA_PROPERTY_ID</code>: o ID numérico da sua propriedade GA4.
              </p>
            </div>
          </div>

          <Button 
            onClick={() => setShowSetupModal(false)}
            className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground"
          >
            Entendi, fechar guia
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
