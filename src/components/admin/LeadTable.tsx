import { useState } from "react";
import { Lead, RegisteredUser } from "@/types/admin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, XCircle, Clock, Trophy, Crown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadTableProps {
  leads: (Lead | RegisteredUser)[];
  selectedLeads: string[];
  onSelectLead: (leadId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onSendEmail: (leadIds: string[]) => void;
  onViewLogs: (leadId: string) => void;
}

// Type guard para verificar se é Lead ou RegisteredUser
const isLead = (item: Lead | RegisteredUser): item is Lead => {
  return 'origin' in item;
};

const isRegisteredUser = (item: Lead | RegisteredUser): item is RegisteredUser => {
  return 'is_founder' in item;
};

export default function LeadTable({
  leads,
  selectedLeads,
  onSelectLead,
  onSelectAll,
  onSendEmail,
  onViewLogs
}: LeadTableProps) {
  const allSelected = leads.length > 0 && selectedLeads.length === leads.length;

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      {selectedLeads.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/20 rounded-xl">
          <span className="text-sm font-medium">
            {selectedLeads.length} lead(s) selecionado(s)
          </span>
          <Button
            size="sm"
            onClick={() => onSendEmail(selectedLeads)}
            className="bg-gradient-to-r from-amber-500 to-purple-500 hover:from-amber-600 hover:to-purple-600"
          >
            <Mail className="w-4 h-4 mr-2" />
            Enviar E-mail
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Info</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum lead encontrado
                </TableCell>
              </TableRow>
            ) : (
              leads.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.includes(item.id)}
                      onCheckedChange={() => onSelectLead(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.name || <span className="text-muted-foreground italic">Sem nome</span>}
                  </TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>
                    {isLead(item) ? (
                      // Waitlist - Mostrar origem
                      <Badge variant="outline" className="text-xs">
                        {item.origin}
                      </Badge>
                    ) : (
                      // User - Mostrar se tem boas-vindas enviado
                      isRegisteredUser(item) && item.is_founder ? (
                        <Badge variant="outline" className="text-xs bg-gradient-to-r from-amber-500/10 to-purple-500/10 border-amber-500/30">
                          <Trophy className="w-3 h-3 mr-1" />
                          Fundador
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Usuário
                        </Badge>
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    {isLead(item) ? (
                      // Waitlist - Mostrar status de boas-vindas
                      item.welcome_email_sent ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs">
                            {item.welcome_email_sent_at &&
                              format(new Date(item.welcome_email_sent_at), "dd/MM/yy", { locale: ptBR })
                            }
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs">Não enviado</span>
                        </div>
                      )
                    ) : (
                      // User - Mostrar info de premium/founder
                      isRegisteredUser(item) && item.is_founder ? (
                        <div className="flex items-center gap-2 text-purple-600">
                          <Crown className="w-4 h-4" />
                          <span className="text-xs">
                            Premium {item.premium_until && `até ${format(new Date(item.premium_until), "dd/MM/yy", { locale: ptBR })}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSendEmail([item.id])}
                        className="h-8 px-2"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewLogs(item.id)}
                        className="h-8 px-2"
                      >
                        <Clock className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
