import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, UserPlus, Mail, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UserInviteSearchProps {
  onUserInvited: (user: {
    id: string;
    name: string;
    email: string;
    username?: string;
    avatar_url?: string;
    status: "convidado" | "pendente" | "convite_email";
    isFriend: boolean;
  }) => void;
  excludeUserIds: string[];
  friends: { friend_id: string }[];
}

export const UserInviteSearch = ({
  onUserInvited,
  excludeUserIds,
  friends,
}: UserInviteSearchProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const isFriend = (userId: string) => {
    return friends.some((f) => f.friend_id === userId);
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    setSearching(true);
    setNotFound(false);
    setSearchResult(null);

    try {
      const query = searchInput.trim();
      const isEmail = query.includes("@");

      if (isEmail) {
        // Buscar por email exato
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .limit(100);

        if (error) throw error;

        // Verificar qual perfil tem esse email
        for (const profile of profiles || []) {
          try {
            const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
            if (user && user.email?.toLowerCase() === query.toLowerCase()) {
              setSearchResult({
                ...profile,
                email: user.email,
              });
              return;
            }
          } catch (err) {
            continue;
          }
        }

        // Se não encontrou usuário, é um email não cadastrado
        setSearchResult({
          id: `email_${query}`,
          email: query,
          display_name: query.split("@")[0],
          isNonUser: true,
        });
      } else {
        // Buscar por username exato
        const usernameQuery = query.replace(/^@/, "");
        
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .eq("username", usernameQuery)
          .single();

        if (error) {
          setNotFound(true);
          return;
        }

        if (data) {
          // Buscar email
          try {
            const { data: { user } } = await supabase.auth.admin.getUserById(data.id);
            setSearchResult({
              ...data,
              email: user?.email || "",
            });
          } catch {
            setSearchResult(data);
          }
        } else {
          setNotFound(true);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar:", error);
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!searchResult) return;

    // Se for email não cadastrado
    if (searchResult.isNonUser) {
      onUserInvited({
        id: searchResult.id,
        name: searchResult.display_name,
        email: searchResult.email,
        status: "convite_email",
        isFriend: false,
      });

      toast({
        title: "Convite por e-mail",
        description: `Um e-mail de convite será enviado para ${searchResult.email}`,
      });

      setSearchInput("");
      setSearchResult(null);
      return;
    }

    // Se já está na lista
    if (excludeUserIds.includes(searchResult.id)) {
      toast({
        title: "Já convidado",
        description: "Esta pessoa já está na lista de convidados.",
        variant: "destructive",
      });
      return;
    }

    const userIsFriend = isFriend(searchResult.id);

    // Se não é amigo, pedir para adicionar primeiro
    if (!userIsFriend) {
      toast({
        title: "Adicione como amigo primeiro",
        description: "Para convidar esta pessoa, você precisa adicioná-la como amigo.",
        variant: "destructive",
      });
      return;
    }

    // Se é amigo, adicionar
    onUserInvited({
      id: searchResult.id,
      name: searchResult.display_name || searchResult.email.split("@")[0],
      email: searchResult.email,
      username: searchResult.username,
      avatar_url: searchResult.avatar_url,
      status: "convidado",
      isFriend: true,
    });

    toast({
      title: "Convidado adicionado",
      description: `${searchResult.display_name} foi adicionado à lista.`,
    });

    setSearchInput("");
    setSearchResult(null);
  };

  const handleAddFriend = async () => {
    if (!searchResult || searchResult.isNonUser) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Criar pedido de amizade
      const { error } = await supabase.from("friend_requests").insert({
        sender_id: user.id,
        receiver_id: searchResult.id,
        receiver_email: searchResult.email,
      });

      if (error) throw error;

      // Criar notificação
      await supabase.from("notifications").insert({
        user_id: searchResult.id,
        type: "friend_request",
        title: "Novo pedido de amizade",
        message: `${user.email} quer ser seu amigo`,
      });

      toast({
        title: "Pedido enviado",
        description: "Convite de amizade enviado com sucesso!",
      });

      setSearchInput("");
      setSearchResult(null);
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o pedido de amizade.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Buscar pessoa para convidar</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Digite username completo ou email completo"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={searching || !searchInput.trim()}
            variant="secondary"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Digite o username completo (@usuario) ou email completo (email@exemplo.com)
        </p>
      </div>

      {searching && (
        <Alert>
          <AlertDescription>Buscando...</AlertDescription>
        </Alert>
      )}

      {notFound && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Usuário não encontrado. Verifique se digitou corretamente.
          </AlertDescription>
        </Alert>
      )}

      {searchResult && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            {!searchResult.isNonUser ? (
              <>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={searchResult.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {searchResult.display_name?.charAt(0) || searchResult.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {searchResult.display_name || searchResult.email.split("@")[0]}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {searchResult.username ? `@${searchResult.username}` : searchResult.email}
                  </p>
                </div>
                {!isFriend(searchResult.id) && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
                    Não é amigo
                  </Badge>
                )}
                {isFriend(searchResult.id) && (
                  <Badge variant="secondary">Amigo</Badge>
                )}
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{searchResult.email}</p>
                  <p className="text-sm text-muted-foreground">Não é usuário do app</p>
                </div>
                <Badge variant="outline">Convite por e-mail</Badge>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {searchResult.isNonUser ? (
              <Button onClick={handleInvite} className="flex-1" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Enviar Convite por E-mail
              </Button>
            ) : isFriend(searchResult.id) ? (
              <Button onClick={handleInvite} className="flex-1" size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar ao Evento
              </Button>
            ) : (
              <Button onClick={handleAddFriend} className="flex-1" size="sm" variant="secondary">
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar como Amigo Primeiro
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
