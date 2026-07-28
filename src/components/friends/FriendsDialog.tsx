/**
 * FriendsDialog V2 - Estilo divertido e colorido
 * Inspirado na LandingV3 com cards tortos e elementos jogados
 */

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
import { Users, Search, UserPlus, Loader2, Heart, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { UserSearchCard } from "./UserSearchCard";
import { FriendCard } from "./FriendCard";
import { FriendRequestCard } from "./FriendRequestCard";
import { motion } from "framer-motion";

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

// Cores divertidas para as abas
const tabColors = {
  search: { bg: '#FFD93D', icon: Search },
  friends: { bg: '#A8D8FF', icon: Users },
  requests: { bg: '#FF69B4', icon: UserPlus },
};

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
        toast({
          title: "Busca por email",
          description: "Enviaremos a solicitação para este email se ele existir.",
        });
        setSearchResult({
          id: "",
          display_name: normalizedSearch,
          username: "",
          avatar_url: undefined,
          email: normalizedSearch,
        });
      } else {
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
        setSearchResult({ ...data, email: data.username });
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
      toast({ title: "Solicitação enviada!", description: "Aguarde a aceitação do seu amigo." });
      setSearchResult(null);
      setSearchTerm("");
      fetchFriends();
    } catch (error) {
      const err = error as { message?: string; error_description?: string };
      const errorMessage = err.message || err.error_description || "Erro desconhecido";
      console.error("Erro detalhado ao enviar solicitação:", error);
      toast({ title: "Atenção", description: errorMessage, variant: "destructive" });
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
      toast({ title: "Amizade aceita!", description: "Vocês agora são amigos." });
      fetchFriends();
      fetchPendingRequests();
    } catch (error) {
      const err = error as { message?: string };
      toast({ title: "Erro ao aceitar solicitação", description: err?.message || "Tente novamente.", variant: "destructive" });
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
      toast({ title: "Solicitação recusada", description: "A solicitação foi removida." });
      fetchPendingRequests();
    } catch (error) {
      const err = error as { message?: string };
      toast({ title: "Erro ao recusar solicitação", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm("Deseja remover este amigo? Esta ação não pode ser desfeita.")) return;
    try {
      setActionLoading(friendId);
      const { error } = await supabase
        .from("friendships")
        .delete()
        .or(`and(user_id_1.eq.${user?.id},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${user?.id})`);
      if (error) throw error;
      toast({ title: "Amigo removido", description: "A amizade foi desfeita." });
      fetchFriends();
    } catch (error) {
      const err = error as { message?: string };
      toast({ title: "Erro ao remover amigo", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const isFriend = (userId: string) => friends.some((f) => f.friend_id === userId);
  const hasPendingRequest = () => false;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05, rotate: -2 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-xl border-[3px] border-black bg-[#A8D8FF] shadow-[4px_4px_0px_0px_#000000] font-bold text-sm flex items-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Amigos</span>
          {friends.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-black text-white text-xs">
              {friends.length}
            </span>
          )}
        </motion.button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_#000000] rounded-2xl">
        {/* Header divertido */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              className="w-14 h-14 rounded-xl border-[3px] border-black bg-[#FFD93D] shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center transform -rotate-3"
            >
              <Users className="w-7 h-7 text-black" />
            </motion.div>
            <div>
              <DialogTitle className="text-2xl font-black text-black">Seus Amigos</DialogTitle>
              <DialogDescription className="text-gray-600 font-medium">
                Adicione amigos para facilitar a criação de eventos em grupo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="search" className="flex-1 flex flex-col overflow-hidden px-6">
          {/* Tabs coloridos */}
          <TabsList className="grid w-full grid-cols-3 gap-2 bg-transparent p-0 h-auto mt-4">
            {[
              { value: 'search', label: 'Buscar', color: '#FFD93D', icon: Search, count: null },
              { value: 'friends', label: 'Amigos', color: '#A8D8FF', icon: Users, count: friends.length },
              { value: 'requests', label: 'Pendentes', color: '#FF69B4', icon: UserPlus, count: pendingRequests.length },
            ].map((tab, index) => {
              const Icon = tab.icon;
              const rotation = index === 0 ? -1 : index === 2 ? 1 : 0;
              
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-[3px] border-black font-bold text-sm
                    shadow-[4px_4px_0px_0px_#000000] transition-all duration-150 data-[state=active]:shadow-[1px_1px_0px_0px_#000000] data-[state=active]:translate-x-[3px] data-[state=active]:translate-y-[3px]
                  `}
                  style={{ 
                    backgroundColor: 'white',
                    transform: `rotate(${rotation}deg)`
                  }}
                >
                  <div className="w-8 h-8 rounded-lg border-[2px] border-black bg-gray-100 flex items-center justify-center data-[state=active]:bg-white">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-black text-white text-xs">
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Conteúdo: Buscar */}
          <TabsContent value="search" className="flex-1 overflow-y-auto space-y-4 mt-4 pb-6">
            <div className="rounded-xl border-[3px] border-black bg-[#FFFDF7] shadow-[4px_4px_0px_0px_#000000] p-4">
              <Label htmlFor="search" className="font-bold text-sm mb-2 block">
                Buscar por nome de usuário ou e-mail
              </Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Digite @usuario ou email@exemplo.com"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUser()}
                  className="flex-1 border-[3px] border-black shadow-[2px_2px_0px_0px_#000000] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all rounded-lg"
                />
                <Button 
                  onClick={searchUser} 
                  disabled={searching || !searchTerm.trim()}
                  className="px-4 py-2 rounded-xl border-[3px] border-black bg-[#FFD93D] shadow-[3px_3px_0px_0px_#000000] font-bold hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all disabled:opacity-50"
                >
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">
                Digite o nome de usuário (sem @) ou o e-mail completo
              </p>
            </div>

            {searchResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <h3 className="font-bold text-sm mb-3">Resultado da busca</h3>
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
              </motion.div>
            )}

            {!searchResult && !searching && searchTerm.trim() === "" && (
              <div className="text-center py-12">
                <div className="w-24 h-24 rounded-2xl border-[3px] border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center mx-auto mb-4 transform -rotate-3">
                  <Search className="w-12 h-12 text-black" />
                </div>
                <p className="font-bold text-gray-600">Digite um nome de usuário ou e-mail para buscar</p>
              </div>
            )}
          </TabsContent>

          {/* Conteúdo: Amigos */}
          <TabsContent value="friends" className="flex-1 overflow-y-auto space-y-3 mt-4 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-16 h-16 rounded-xl border-[3px] border-black bg-[#A8D8FF] shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 rounded-2xl border-[3px] border-black bg-[#A8D8FF] shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center mx-auto mb-4 transform rotate-2">
                  <Users className="w-12 h-12 text-black" />
                </div>
                <p className="font-bold text-gray-600 mb-1">Você ainda não tem amigos adicionados.</p>
                <p className="text-sm text-gray-500">Use a busca para encontrar pessoas!</p>
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

          {/* Conteúdo: Solicitações */}
          <TabsContent value="requests" className="flex-1 overflow-y-auto space-y-3 mt-4 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-16 h-16 rounded-xl border-[3px] border-black bg-[#FF69B4] shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 rounded-2xl border-[3px] border-black bg-[#FF69B4] shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center mx-auto mb-4 transform -rotate-2">
                  <UserPlus className="w-12 h-12 text-white" />
                </div>
                <p className="font-bold text-gray-600">Nenhuma solicitação pendente.</p>
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

        {/* Elementos decorativos */}
        <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-[#FFD93D] border-[3px] border-black" />
        <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#FF69B4] border-[3px] border-black" />
      </DialogContent>
    </Dialog>
  );
};

export default FriendsDialog;
