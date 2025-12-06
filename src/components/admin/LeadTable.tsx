import { useState } from "react";
import { Lead } from "@/types/admin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadTableProps {
  leads: Lead[];
  selectedLeads: string[];
  onSelectLead: (leadId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onSendEmail: (leadIds: string[]) => void;
  onViewLogs: (leadId: string) => void;
}

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
              <TableHead>Origem</TableHead>
              <TableHead>Boas-vindas</TableHead>
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
              leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => onSelectLead(lead.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {lead.name || <span className="text-muted-foreground italic">Sem nome</span>}
                  </TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {lead.origin}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.welcome_email_sent ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs">
                          {lead.welcome_email_sent_at &&
                            format(new Date(lead.welcome_email_sent_at), "dd/MM/yy HH:mm", { locale: ptBR })
                          }
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs">Não enviado</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSendEmail([lead.id])}
                        className="h-8 px-2"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewLogs(lead.id)}
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
