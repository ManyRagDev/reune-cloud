import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Users, Gift, Mail } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import AdminEmailCenter from "./AdminEmailCenter";

const AdminDashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [waitlistData, setWaitlistData] = useState<any[]>([]);
    const [eventsData, setEventsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await fetchData();
        if (ok) {
            setIsAuthenticated(true);
        } else {
            alert("Senha incorreta ou função admin indisponível");
        }
    };

    const fetchData = async (): Promise<boolean> => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('get-admin-data', {
                body: { password }
            });

            if (error) throw error;

            if (data) {
                setWaitlistData(data.waitlist || []);
                setEventsData(data.events || []);
            }

            return true;
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Erro ao carregar dados. Verifique se a função foi deployada.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
                {/* Animated Background Orbs */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, delay: 1 }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
                />

                <div className="relative z-10">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/50 to-purple-500/50 rounded-3xl blur opacity-25"></div>
                        <Card className="relative w-full max-w-md border-2 border-border/50 bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
                            <div className="h-2 w-full bg-gradient-to-r from-amber-500 to-purple-500" />
                            <CardHeader className="text-center pt-8">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="flex justify-center mb-4"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                                        <div className="relative w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-purple-500 flex items-center justify-center">
                                            <Lock className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                </motion.div>
                                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-purple-500 bg-clip-text text-transparent">
                                    Acesso Admin
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <Input
                                        type="password"
                                        placeholder="Senha de acesso"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm"
                                    />
                                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-amber-500 to-purple-500 hover:from-amber-600 hover:to-purple-600">
                                        Entrar
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Tabs defaultValue="dashboard" className="min-h-screen bg-background">
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
                <TabsList className="bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl h-12">
                    <TabsTrigger value="dashboard" className="text-base">Dashboard</TabsTrigger>
                    <TabsTrigger value="email-center" className="text-base">
                        <Mail className="w-4 h-4 mr-2" />
                        Email Center
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="dashboard" className="m-0">
                <div className="min-h-screen bg-background relative overflow-hidden p-8 pt-24">
                    {/* Animated Background Orbs */}
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

                    <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-purple-500 bg-clip-text text-transparent">
                                Painel Administrativo
                            </h1>
                            <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
                                Sair
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Total na Lista de Espera
                                    </CardTitle>
                                    <Users className="h-4 w-4 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{waitlistData.length}</div>
                                </CardContent>
                            </Card>
                            <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Eventos de Amigo Secreto
                                    </CardTitle>
                                    <Gift className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{eventsData.length}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Tabs defaultValue="waitlist" className="w-full">
                            <TabsList className="bg-card/80 backdrop-blur-sm">
                                <TabsTrigger value="waitlist">Lista de Espera</TabsTrigger>
                                <TabsTrigger value="events">Amigo Secreto</TabsTrigger>
                            </TabsList>

                            <TabsContent value="waitlist">
                                <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle>Cadastros na Lista de Espera</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Data</TableHead>
                                                    <TableHead>Email</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {waitlistData.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                        </TableCell>
                                                        <TableCell>{item.email}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="events">
                                <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle>Eventos Criados</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Data Criação</TableHead>
                                                    <TableHead>Nome do Evento</TableHead>
                                                    <TableHead>Data Sorteio</TableHead>
                                                    <TableHead>Configuração</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {eventsData.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {item.table_reune?.title || "Sem nome"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.draw_date
                                                                ? format(new Date(item.draw_date), "dd/MM/yyyy", { locale: ptBR })
                                                                : "Não definida"}
                                                        </TableCell>
                                                        <TableCell>
                                                            Min: {item.min_value ? `R$ ${item.min_value}` : "-"} |
                                                            Max: {item.max_value ? `R$ ${item.max_value}` : "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="email-center" className="m-0">
                <AdminEmailCenter password={password} onLogout={() => setIsAuthenticated(false)} />
            </TabsContent>
        </Tabs>
    );
};

export default AdminDashboard;
