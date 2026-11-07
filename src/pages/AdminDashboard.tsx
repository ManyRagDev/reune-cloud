import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Lock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AdminEmailCenter from "./AdminEmailCenter";

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

  const [loading, setLoading] = useState(false);
  const [waitlistData, setWaitlistData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<RegisteredUser[]>([]);
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-admin-data", {});

      if (error) throw error;

      if (data) {
        setWaitlistData(data.waitlist || []);
        setUsersData(data.users || []);
        setEventsData(data.events || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados administrativos:", error);
      toast.error("Erro ao carregar dados do painel admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
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
    if (!searchQuery.trim()) return usersData;
    const q = searchQuery.toLowerCase().trim();
    return usersData.filter(
      (u) =>
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        u.id.toLowerCase().includes(q)
    );
  }, [usersData, searchQuery]);

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
                  Painel de Controle
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
              onClick={fetchData}
              disabled={loading}
              className="rounded-xl border-border/60 text-xs font-semibold h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
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
        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Total de Usuários
                <Users className="w-4 h-4 text-primary" />
              </CardDescription>
              <CardTitle className="text-3xl font-black text-foreground">{usersData.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              Cadastrados no ReUNE
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Membros Founders
                <Sparkles className="w-4 h-4 text-amber-500" />
              </CardDescription>
              <CardTitle className="text-3xl font-black text-amber-500">
                {usersData.filter((u) => u.is_founder).length}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              Com benefícios vitalícios
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Eventos Amigo Secreto
                <Gift className="w-4 h-4 text-purple-500" />
              </CardDescription>
              <CardTitle className="text-3xl font-black text-purple-500">{eventsData.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              Grupos e sorteios
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Lista de Espera
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </CardDescription>
              <CardTitle className="text-3xl font-black text-emerald-500">{waitlistData.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              Leads na Waitlist
            </CardContent>
          </Card>
        </div>

        {/* Abas do Painel */}
        <Tabs defaultValue="users" className="space-y-6">
          <div className="flex items-center justify-between overflow-x-auto pb-1">
            <TabsList className="bg-muted/70 p-1 rounded-2xl border border-border/50 h-11">
              <TabsTrigger value="users" className="rounded-xl px-4 font-bold text-xs">
                <Users className="w-3.5 h-3.5 mr-2" />
                Usuários ({usersData.length})
              </TabsTrigger>
              <TabsTrigger value="waitlist" className="rounded-xl px-4 font-bold text-xs">
                <UserCheck className="w-3.5 h-3.5 mr-2" />
                Waitlist ({waitlistData.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="rounded-xl px-4 font-bold text-xs">
                <Gift className="w-3.5 h-3.5 mr-2" />
                Amigo Secreto ({eventsData.length})
              </TabsTrigger>
              <TabsTrigger value="email-center" className="rounded-xl px-4 font-bold text-xs">
                <Mail className="w-3.5 h-3.5 mr-2" />
                Email Center
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: USUÁRIOS CADASTRADOS */}
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* TAB 2: WAITLIST */}
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
                    {waitlistData.map((item) => (
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
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: AMIGO SECRETO */}
          <TabsContent value="events" className="space-y-4">
            <Card className="rounded-3xl border-2 border-border/50 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
              <CardHeader className="p-6 border-b border-border/40">
                <CardTitle className="text-xl font-black text-foreground">
                  Eventos de Amigo Secreto Criados
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Grupos criados pela suíte completa ou sorteador relâmpago
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
                    {eventsData.map((item) => (
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
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: CENTRAL DE EMAILS */}
          <TabsContent value="email-center" className="m-0">
            <AdminEmailCenter password="" onLogout={() => navigate("/")} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
