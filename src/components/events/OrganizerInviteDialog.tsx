import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UserInviteSearch } from "./UserInviteSearch";

interface OrganizerInviteDialogProps {
  onInvite: (
    userId: string,
    email: string,
    name: string,
    isOrganizer: boolean
  ) => Promise<{ error: string | null }>;
  excludeUserIds: string[];
  friends: { friend_id: string }[];
  isOrganizer?: boolean;
  triggerLabel?: string;
}

export const OrganizerInviteDialog = ({
  onInvite,
  excludeUserIds,
  friends,
  isOrganizer = false,
  triggerLabel = "Convidar Pessoa",
}: OrganizerInviteDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleUserInvited = async (user: {
    id: string;
    name: string;
    email: string;
    username?: string;
    avatar_url?: string;
    status: "convidado" | "pendente" | "convite_email";
    isFriend: boolean;
  }) => {
    const result = await onInvite(user.id, user.email, user.name, isOrganizer);

    if (!result.error) {
      setOpen(false);
    }

    return result;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isOrganizer ? "Convidar Organizador" : "Convidar Participante"}
          </DialogTitle>
          <DialogDescription>
            Busque por usuário ou email para enviar o convite.
          </DialogDescription>
        </DialogHeader>

        <UserInviteSearch
          onUserInvited={handleUserInvited}
          excludeUserIds={excludeUserIds}
          friends={friends}
        />
      </DialogContent>
    </Dialog>
  );
};
