import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, CheckCircle2, Clock, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { UserInviteSearch } from "./UserInviteSearch";

export interface Invitee {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar_url?: string;
  status: "convidado" | "pendente" | "confirmado" | "convite_email";
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
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase.rpc("get_friends");
      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error("Erro ao buscar amigos:", error);
    }
  };

  const handleUserInvited = (user: Invitee) => {
    onInviteesChange([...selectedInvitees, user]);
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
      case "convite_email":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Por e-mail
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <UserInviteSearch
        onUserInvited={handleUserInvited}
        excludeUserIds={selectedInvitees.map((inv) => inv.id)}
        friends={friends}
      />

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
          {selectedInvitees.some((inv) => inv.status === "pendente" || inv.status === "convite_email") && (
            <div className="space-y-1">
              {selectedInvitees.some((inv) => inv.status === "pendente") && (
                <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Convites pendentes serão ativados quando a amizade for aceita
                </p>
              )}
              {selectedInvitees.some((inv) => inv.status === "convite_email") && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Convites por e-mail serão enviados para não-usuários
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
