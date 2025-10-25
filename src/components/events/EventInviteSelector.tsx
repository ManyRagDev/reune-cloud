import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, Search, UserPlus, Users, CheckCircle2, Clock, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface Invitee {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar_url?: string;
  status: "convidado" | "pendente" | "confirmado";
  isFriend: boolean;
}

interface EventInviteSelectorProps {
  selectedInvitees: Invitee[];
  onInviteesChange: (invitees: Invitee[]) => void;
}

interface Friend {
  friend_id: string;
  display_name: string;
  avatar_url?: string;
  email: string;
}

export const EventInviteSelector = ({
  selectedInvitees,
  onInviteesChange,
}: EventInviteSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Buscar amigos ao abrir
  useEffect(() => {
    if (open) {
      fetchFriends();
    }
  }, [open]);

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase.rpc("get_friends");
      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error("Erro ao buscar amigos:", error);
    }
  };

  // Buscar usuários em tempo real
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const isEmail = query.includes("@");
      const normalizedQuery = query.trim().toLowerCase();

      if (isEmail) {
        // Buscar por email - precisa combinar profiles + auth
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .limit(10);

        if (error) throw error;

        // Filtrar perfis que têm o email correspondente
        const results = [];
        for (const profile of profiles || []) {
          try {
            const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
            if (user && user.email?.toLowerCase().includes(normalizedQuery)) {
              results.push({
                ...profile,
                email: user.email,
              });
            }
          } catch (err) {
            // Ignorar erros de usuários individuais
            continue;
          }
        }
        setSearchResults(results);
      } else {
        // Buscar por username
        const usernameQuery = normalizedQuery.replace(/^@/, "");
        
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .ilike("username", `%${usernameQuery}%`)
          .limit(10);

        if (error) throw error;

        // Buscar emails correspondentes
        const resultsWithEmail = await Promise.all(
          (data || []).map(async (profile) => {
            try {
              const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
              return {
                ...profile,
                email: user?.email || "",
              };
            } catch {
              return {
                ...profile,
                email: "",
              };
            }
          })
        );

        setSearchResults(resultsWithEmail.filter(r => r.email));
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce na busca
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchUsers]);

  const isFriend = (userId: string) => {
    return friends.some((f) => f.friend_id === userId);
  };

  const isAlreadyInvited = (userId: string) => {
    return selectedInvitees.some((inv) => inv.id === userId);
  };

  const addInvitee = (user: any) => {
    if (isAlreadyInvited(user.id)) {
      toast({
        title: "Já convidado",
        description: "Esta pessoa já está na lista de convidados.",
        variant: "destructive",
      });
      return;
    }

    const isFriendUser = isFriend(user.id);
    const newInvitee: Invitee = {
      id: user.id,
      name: user.display_name || user.email.split("@")[0],
      email: user.email,
      username: user.username,
      avatar_url: user.avatar_url,
      status: isFriendUser ? "convidado" : "pendente",
      isFriend: isFriendUser,
    };

    onInviteesChange([...selectedInvitees, newInvitee]);

    if (!isFriendUser) {
      toast({
        title: "Convite pendente criado",
        description: "Será atualizado automaticamente se a amizade for aceita.",
      });
    } else {
      toast({
        title: "Convidado adicionado",
        description: `${newInvitee.name} foi adicionado à lista.`,
      });
    }

    setSearchTerm("");
    setSearchResults([]);
    setOpen(false);
  };

  const removeInvitee = (inviteeId: string) => {
    onInviteesChange(selectedInvitees.filter((inv) => inv.id !== inviteeId));
  };

  const getStatusBadge = (status: Invitee["status"]) => {
    switch (status) {
      case "convidado":
        return (
          <Badge variant="secondary" className="gap-1">
            <UserCheck className="w-3 h-3" />
            Convidado
          </Badge>
        );
      case "pendente":
        return (
          <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-400">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        );
      case "confirmado":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Confirmado
          </Badge>
        );
    }
  };

  // Mostrar amigos primeiro nos resultados
  const sortedResults = [...searchResults].sort((a, b) => {
    const aIsFriend = isFriend(a.id);
    const bIsFriend = isFriend(b.id);
    if (aIsFriend && !bIsFriend) return -1;
    if (!aIsFriend && bIsFriend) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Convidar Participantes</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-start"
            >
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              Buscar por nome de usuário ou e-mail...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Digite @usuario ou email@exemplo.com"
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>
                  {loading
                    ? "Buscando..."
                    : searchTerm
                    ? "Nenhum usuário encontrado."
                    : "Digite para buscar usuários"}
                </CommandEmpty>
                {sortedResults.length > 0 && (
                  <CommandGroup heading="Resultados">
                    {sortedResults.map((user) => {
                      const userIsFriend = isFriend(user.id);
                      const alreadyInvited = isAlreadyInvited(user.id);

                      return (
                        <CommandItem
                          key={user.id}
                          onSelect={() => addInvitee(user)}
                          disabled={alreadyInvited}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {user.display_name?.charAt(0) || user.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {user.display_name || user.email.split("@")[0]}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.username ? `@${user.username}` : user.email}
                              </p>
                            </div>
                            {userIsFriend && (
                              <Badge variant="secondary" className="text-xs">
                                Amigo
                              </Badge>
                            )}
                            {alreadyInvited && (
                              <Badge variant="outline" className="text-xs">
                                Já convidado
                              </Badge>
                            )}
                            {!userIsFriend && !alreadyInvited && (
                              <Badge
                                variant="outline"
                                className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400"
                              >
                                Não é amigo
                              </Badge>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Adicione amigos ou busque usuários pelo username ou e-mail
        </p>
      </div>

      {/* Lista de convidados */}
      {selectedInvitees.length > 0 && (
        <div className="space-y-2">
          <Label>Pessoas Convidadas ({selectedInvitees.length})</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
            {selectedInvitees.map((invitee) => (
              <div
                key={invitee.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md border",
                  invitee.status === "pendente" && "bg-yellow-50 dark:bg-yellow-950/20"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={invitee.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {invitee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{invitee.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {invitee.username ? `@${invitee.username}` : invitee.email}
                  </p>
                </div>
                {getStatusBadge(invitee.status)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInvitee(invitee.id)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {selectedInvitees.some((inv) => inv.status === "pendente") && (
            <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Convites pendentes serão ativados automaticamente quando a amizade for aceita
            </p>
          )}
        </div>
      )}
    </div>
  );
};
