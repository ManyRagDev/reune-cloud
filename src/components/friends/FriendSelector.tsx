import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Friend {
  friend_id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
}

interface FriendSelectorProps {
  selectedFriends: string[];
  onSelectionChange: (friendIds: string[]) => void;
}

export function FriendSelector({ selectedFriends, onSelectionChange }: FriendSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ['friends', search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_friends', {
        _search: search || null
      });
      if (error) throw error;
      return data as Friend[];
    },
  });

  const toggleFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      onSelectionChange(selectedFriends.filter(id => id !== friendId));
    } else {
      onSelectionChange([...selectedFriends, friendId]);
    }
  };

  const selectedFriendNames = friends
    .filter(f => selectedFriends.includes(f.friend_id))
    .map(f => f.display_name)
    .join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedFriends.length > 0 ? (
            <span className="truncate">{selectedFriendNames}</span>
          ) : (
            "Selecione amigos para convidar"
          )}
          <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar amigos..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>
            {isLoading ? "Carregando..." : "Nenhum amigo encontrado."}
          </CommandEmpty>
          <CommandGroup>
            {friends.map((friend) => (
              <CommandItem
                key={friend.friend_id}
                onSelect={() => toggleFriend(friend.friend_id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedFriends.includes(friend.friend_id) ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Users className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{friend.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{friend.email}</p>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
