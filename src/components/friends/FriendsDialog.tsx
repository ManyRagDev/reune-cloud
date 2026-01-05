import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { UserSearchCard } from "./UserSearchCard";
import { FriendCard } from "./FriendCard";
import { FriendRequestCard } from "./FriendRequestCard";

interface Friend {
  friend_id: string;
  display_name: string;
  avatar_url?: string;
  username?: string | null;
}

interface FriendRequest {
  request_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  created_at: string;
}

interface SearchResult {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
  email: string;
}

export const FriendsDialog = () => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Buscar amigos ao abrir o dialog
  useEffect(() => {
    if (open) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [open]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_friends");

      if (error) throw error;

      setFriends(data || []);
    } catch (error) {
      const err = error as { message?: string };
      console.error("Erro ao buscar amigos:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase.rpc("get_pending_friend_requests");

      if (error) throw error;

      setPendingRequests(data || []);
    } catch (error) {
      const err = error as { message?: string };
      console.error("Erro ao buscar solicitações:", err);
    }
  };

  const searchUser = async () => {
    if (!searchTerm.trim()) {
      setSearchResult(null);
      return;
    }

    try {
      setSearching(true);
      setSearchResult(null);

      const normalizedSearch = searchTerm.trim().toLowerCase();
      const isEmail = normalizedSearch.includes("@") && normalizedSearch.includes(".");

      if (isEmail) {
        // Para email, apenas validar formato e permitir envio
        // A função RPC fará a busca real
        toast({
          title: "Busca por email",
          description: "Enviaremos a solicitação para este email se ele existir.",
        });

        setSearchResult({
          id: "", // Não temos o ID ainda
          display_name: normalizedSearch,
          username: "",
          avatar_url: undefined,
          email: normalizedSearch,
        });
      } else {
        // Buscar por username (remover @ se houver)
        const usernameSearch = normalizedSearch.replace(/^@/, "");

        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .ilike("username", usernameSearch)
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Usuário não encontrado",
            description: "Não existe um usuário com esse nome de usuário.",
            variant: "destructive",
          });
          return;
        }

        setSearchResult({
          ...data,
          email: data.username, // Usar username como identificador
        });
      }
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro na busca",
        description: err?.message || "Não foi possível buscar o usuário.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (identifier: string) => {
    if (!user) return;

    try {
      setActionLoading(identifier);

      const { data, error } = await supabase.rpc("send_friend_request", {
        _receiver_identifier: identifier,
      });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Aguarde a aceitação do seu amigo.",
      });

      setSearchResult(null);
      setSearchTerm("");
      fetchFriends();
    } catch (error) {
      const err = error as { message?: string; error_description?: string };
      const errorMessage = err.message || err.error_description || "Erro desconhecido";

      console.error("Erro detalhado ao enviar solicitação:", error);

      // Tenta usar a mensagem direta do backend se parecer uma mensagem amigável de erro
      if (errorMessage !== "Erro desconhecido" &&
        (errorMessage.includes("já existe") ||
          errorMessage.includes("pendente") ||
          errorMessage.includes("encontrado") ||
          errorMessage.includes("auto") ||
          errorMessage.includes("amigos"))) {
        toast({
          title: "Atenção",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        // Fallback para mensagens específicas mapeadas
        if (errorMessage.includes("já são amigos")) {
          toast({
            title: "Vocês já são amigos",
            description: "Esta pessoa já está na sua lista de amigos.",
            variant: "destructive",
          });
        } else if (errorMessage.includes("Usuário não encontrado")) {
          toast({
            title: "Usuário não encontrado",
            description: "Não foi possível encontrar este usuário.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Não foi possível enviar",
            description: errorMessage || "Tente novamente mais tarde.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setActionLoading(requestId);

      const { error } = await supabase.rpc("respond_to_friend_request", {
        _request_id: requestId,
        _accept: true,
      });

      if (error) throw error;

      toast({
        title: "Amizade aceita!",
        description: "Vocês agora são amigos.",
      });

      fetchFriends();
      fetchPendingRequests();
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao aceitar solicitação",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setActionLoading(requestId);

      const { error } = await supabase.rpc("respond_to_friend_request", {
        _request_id: requestId,
        _accept: false,
      });

      if (error) throw error;

      toast({
        title: "Solicitação recusada",
        description: "A solicitação foi removida.",
      });

      fetchPendingRequests();
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao recusar solicitação",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm("Deseja remover este amigo? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      setActionLoading(friendId);

      // Deletar amizade usando filtro apropriado
      const { error } = await supabase
        .from("friendships")
        .delete()
        .or(`and(user_id_1.eq.${user?.id},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${user?.id})`);

      if (error) throw error;

      toast({
        title: "Amigo removido",
        description: "A amizade foi desfeita.",
      });

      fetchFriends();
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao remover amigo",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const isFriend = (userId: string) => {
    return friends.some((f) => f.friend_id === userId);
  };

  const hasPendingRequest = () => {
    // Placeholder - pode ser implementado se necessário
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} >
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          <Users className="w-4 h-4 mr-2" />
          Amigos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Amigos</DialogTitle>
          <DialogDescription>
            Adicione amigos para facilitar a criação de eventos em grupo
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="search" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </TabsTrigger>
            <TabsTrigger value="friends">
              <Users className="w-4 h-4 mr-2" />
              Amigos ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              <UserPlus className="w-4 h-4 mr-2" />
              Solicitações ({pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="flex-1 overflow-y-auto space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por nome de usuário ou e-mail</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Digite @usuario ou email@exemplo.com"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      searchUser();
                    }
                  }}
                />
                <Button onClick={searchUser} disabled={searching || !searchTerm.trim()}>
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Digite o nome de usuário (sem @) ou o e-mail completo
              </p>
            </div>

            {searchResult && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-3">Resultado da busca</h3>
                <UserSearchCard
                  userId={searchResult.id}
                  displayName={searchResult.display_name}
                  username={searchResult.username}
                  avatarUrl={searchResult.avatar_url}
                  email={searchResult.email}
                  isFriend={isFriend(searchResult.id)}
                  hasPendingRequest={hasPendingRequest()}
                  onSendRequest={() => handleSendRequest(searchResult.username || searchResult.email)}
                  loading={actionLoading === (searchResult.username || searchResult.email)}
                />
              </div>
            )}

            {!searchResult && !searching && searchTerm.trim() === "" && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Digite um nome de usuário ou e-mail para buscar</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="friends" className="flex-1 overflow-y-auto space-y-3 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Você ainda não tem amigos adicionados.</p>
                <p className="text-sm mt-1">Use a busca para encontrar pessoas!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <FriendCard
                  key={friend.friend_id}
                  friendId={friend.friend_id}
                  displayName={friend.display_name}
                  avatarUrl={friend.avatar_url}
                  username={friend.username || undefined}
                  onRemove={() => handleRemoveFriend(friend.friend_id)}
                  loading={actionLoading === friend.friend_id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="flex-1 overflow-y-auto space-y-3 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma solicitação pendente.</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <FriendRequestCard
                  key={request.request_id}
                  requestId={request.request_id}
                  senderId={request.sender_id}
                  senderName={request.sender_name}
                  senderAvatar={request.sender_avatar}
                  createdAt={request.created_at}
                  onAccept={() => handleAcceptRequest(request.request_id)}
                  onReject={() => handleRejectRequest(request.request_id)}
                  loading={actionLoading === request.request_id}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog >
  );
};
