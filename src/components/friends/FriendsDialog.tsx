import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Check, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Friend {
  friend_id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
}

interface PendingRequest {
  request_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  created_at: string;
}

export function FriendsDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar amigos
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_friends');
      if (error) throw error;
      return data as Friend[];
    },
    enabled: open,
  });

  // Buscar pedidos pendentes
  const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['pending-friend-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pending_friend_requests');
      if (error) throw error;
      return data as PendingRequest[];
    },
    enabled: open,
  });

  // Enviar pedido de amizade
  const sendRequestMutation = useMutation({
    mutationFn: async (receiverEmail: string) => {
      const { data, error } = await supabase.rpc('send_friend_request', {
        _receiver_email: receiverEmail
      });
      
      if (error) throw error;
      
      const result = data as any;
      
      // Se usuário não existe, enviar email
      if (!result.user_exists) {
        await supabase.functions.invoke('send-friend-invitation-email', {
          body: {
            receiverEmail,
            senderName: result.sender_name,
            invitationToken: result.invitation_token,
          }
        });
      }
      
      return result;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Convite enviado!",
        description: data.user_exists 
          ? "O usuário receberá uma notificação."
          : "Um e-mail de convite foi enviado.",
      });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Responder pedido de amizade
  const respondMutation = useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      const { data, error } = await supabase.rpc('respond_to_friend_request', {
        _request_id: requestId,
        _accept: accept
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.accept ? "Pedido aceito!" : "Pedido recusado",
        description: variables.accept ? "Agora vocês são amigos." : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['pending-friend-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendRequest = async () => {
    if (!email.trim()) {
      toast({
        title: "E-mail obrigatório",
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    sendRequestMutation.mutate(email);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-2 h-4 w-4" />
          Amigos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meus Amigos</DialogTitle>
          <DialogDescription>
            Adicione amigos para facilitar convites para eventos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adicionar amigo */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Adicionar novo amigo</h3>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
              />
              <Button 
                onClick={handleSendRequest}
                disabled={sendRequestMutation.isPending}
              >
                {sendRequestMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Pedidos pendentes */}
          {pendingRequests.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Pedidos recebidos</h3>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.request_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {request.sender_avatar ? (
                          <img src={request.sender_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Users className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{request.sender_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => respondMutation.mutate({ requestId: request.request_id, accept: true })}
                        disabled={respondMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondMutation.mutate({ requestId: request.request_id, accept: false })}
                        disabled={respondMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de amigos */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Meus amigos ({friends.length})</h3>
            {loadingFriends ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Você ainda não tem amigos adicionados
              </p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.friend_id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Users className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{friend.display_name}</p>
                      <p className="text-xs text-muted-foreground">{friend.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
