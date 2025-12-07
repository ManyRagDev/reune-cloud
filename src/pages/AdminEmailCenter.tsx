import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Mail, CheckCircle2, XCircle, Clock, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminHeader from "@/components/admin/AdminHeader";
import LeadTable from "@/components/admin/LeadTable";
import SendEmailModal from "@/components/admin/SendEmailModal";
import EmailTemplateEditor from "@/components/admin/EmailTemplateEditor";
import EmailLogViewer from "@/components/admin/EmailLogViewer";
import { AdminData } from "@/types/admin";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdminEmailCenterProps {
  password: string;
  onLogout: () => void;
}

export default function AdminEmailCenter({ password, onLogout }: AdminEmailCenterProps) {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'waitlist' | 'users'>('waitlist');

  useEffect(() => {
    if (password) {
      fetchData();
    }
  }, [password]);

  const fetchData = async () => {
    setLoading(true);

    console.log('🔐 Enviando requisição com senha:', password ? '✅ Presente' : '❌ Vazia');

    try {
      const { data: result, error } = await supabase.functions.invoke('get-admin-data', {
        body: { password }
      });

      console.log('📡 Resposta da API:', result);

      if (error) {
        throw new Error(error.message || 'Erro ao carregar dados');
      }

      setData(result);
      toast.success('Dados carregados com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error);
      toast.error(error.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected && data) {
      const currentList = viewMode === 'waitlist' ? data.waitlist : data.users;
      setSelectedLeads(currentList.map(item => item.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSendEmail = (leadIds: string[]) => {
    setSelectedLeads(leadIds);
    setSendEmailModalOpen(true);
  };

  const handleViewLogs = (leadId: string) => {
    // TODO: Implementar visualização de logs específicos do lead
    toast.info(`Logs do lead: ${leadId}`);
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Orbs - Amber/Purple Theme */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="fixed top-0 left-0 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        className="fixed top-1/2 right-1/4 w-[400px] h-[400px] bg-pink-500/15 rounded-full blur-3xl pointer-events-none"
      />

      {/* Header */}
      <AdminHeader
        title="Admin Email Center"
        subtitle="Gerenciamento de e-mails e comunicações"
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-40 pb-20 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {viewMode === 'waitlist' ? 'Leads (Waitlist)' : 'Usuários Registrados'}
                </CardTitle>
                {viewMode === 'waitlist' ? (
                  <Users className="h-4 w-4 text-amber-500" />
                ) : (
                  <UserCog className="h-4 w-4 text-purple-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-purple-500 bg-clip-text text-transparent">
                  {viewMode === 'waitlist' ? data.waitlist.length : data.users?.length || 0}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  E-mails Enviados (30d)
                </CardTitle>
                <Mail className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.emailStats.total}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Sucesso
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {data.emailStats.total > 0
                    ? Math.round((data.emailStats.success / data.emailStats.total) * 100)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sem Boas-vindas
                </CardTitle>
                <XCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {data.leadsWithoutWelcome}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Tabs defaultValue="leads" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="leads" className="text-base">Leads</TabsTrigger>
              <TabsTrigger value="templates" className="text-base">Templates</TabsTrigger>
              <TabsTrigger value="logs" className="text-base">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="space-y-4 mt-6">
              {/* Seletor de View Mode */}
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant={viewMode === 'waitlist' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('waitlist');
                    setSelectedLeads([]);
                  }}
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  Waitlist
                  <Badge variant="secondary" className="ml-1">
                    {data.waitlist.length}
                  </Badge>
                </Button>
                <Button
                  variant={viewMode === 'users' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('users');
                    setSelectedLeads([]);
                  }}
                  className="gap-2"
                >
                  <UserCog className="w-4 h-4" />
                  Usuários Registrados
                  <Badge variant="secondary" className="ml-1">
                    {data.users?.length || 0}
                  </Badge>
                </Button>
              </div>

              <LeadTable
                leads={viewMode === 'waitlist' ? data.waitlist : data.users || []}
                selectedLeads={selectedLeads}
                onSelectLead={handleSelectLead}
                onSelectAll={handleSelectAll}
                onSendEmail={handleSendEmail}
                onViewLogs={handleViewLogs}
              />
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <EmailTemplateEditor
                templates={data.templates}
                password={password}
                onUpdate={fetchData}
              />
            </TabsContent>

            <TabsContent value="logs" className="mt-6">
              <EmailLogViewer password={password} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Send Email Modal */}
      <SendEmailModal
        open={sendEmailModalOpen}
        onClose={() => {
          setSendEmailModalOpen(false);
          setSelectedLeads([]);
        }}
        templates={data.templates}
        leadIds={selectedLeads}
        leadCount={selectedLeads.length}
        password={password}
      />
    </div>
  );
}
