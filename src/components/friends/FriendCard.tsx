import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserMinus } from "lucide-react";

interface FriendCardProps {
  friendId: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  email: string;
  onRemove: () => void;
  loading?: boolean;
}

export const FriendCard = ({
  displayName,
  username,
  avatarUrl,
  email,
  onRemove,
  loading,
}: FriendCardProps) => {
  const getInitials = () => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {displayName}
            </p>
            {username && (
              <p className="text-sm text-muted-foreground truncate">
                @{username}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={loading}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <UserMinus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
