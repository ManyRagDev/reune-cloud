import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Users, Gift, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminDashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [waitlistData, setWaitlistData] = useState<any[]>([]);
    const [eventsData, setEventsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "2025") {
            setIsAuthenticated(true);
            fetchData();
        } else {
            alert("Senha incorreta");
        }
    };

    const fetchData = async () => {
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

        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Erro ao carregar dados. Verifique se a função foi deployada.");
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Acesso Admin
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Senha de acesso"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Button type="submit" className="w-full">
                                Entrar
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Painel Administrativo
                    </h1>
                    <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
                        Sair
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total na Lista de Espera
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{waitlistData.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Eventos de Amigo Secreto
                            </CardTitle>
                            <Gift className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{eventsData.length}</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="waitlist" className="w-full">
                    <TabsList>
                        <TabsTrigger value="waitlist">Lista de Espera</TabsTrigger>
                        <TabsTrigger value="events">Amigo Secreto</TabsTrigger>
                    </TabsList>

                    <TabsContent value="waitlist">
                        <Card>
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
                        <Card>
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
    );
};

export default AdminDashboard;
