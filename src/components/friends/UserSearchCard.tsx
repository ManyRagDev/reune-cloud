import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Check } from "lucide-react";

interface UserSearchCardProps {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  email: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
  onSendRequest: () => void;
  loading?: boolean;
}

export const UserSearchCard = ({
  displayName,
  username,
  avatarUrl,
  email,
  isFriend,
  hasPendingRequest,
  onSendRequest,
  loading,
}: UserSearchCardProps) => {
  const getInitials = () => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl} alt={displayName || email} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {displayName || "Usuário"}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              @{username || email.split("@")[0]}
            </p>
          </div>

          <div>
            {isFriend ? (
              <Button variant="outline" size="sm" disabled>
                <Check className="w-4 h-4 mr-2" />
                Amigos
              </Button>
            ) : hasPendingRequest ? (
              <Button variant="outline" size="sm" disabled>
                Pendente
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={onSendRequest}
                disabled={loading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? "Enviando..." : "Adicionar"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
