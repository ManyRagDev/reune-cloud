import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";

interface FriendRequestCardProps {
  requestId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: string;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
}

export const FriendRequestCard = ({
  senderName,
  senderAvatar,
  createdAt,
  onAccept,
  onReject,
  loading,
}: FriendRequestCardProps) => {
  const getInitials = () => {
    return senderName.charAt(0).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins}min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays}d`;
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={senderAvatar || undefined} alt={senderName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {senderName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(createdAt)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={onAccept}
              disabled={loading}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              disabled={loading}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
