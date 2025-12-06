import { useState } from "react";
import { EmailTemplate } from "@/types/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface EmailTemplateEditorProps {
  templates: EmailTemplate[];
  password: string;
  onUpdate: () => void;
}

export default function EmailTemplateEditor({ templates, password, onUpdate }: EmailTemplateEditorProps) {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    description: "",
    html_content: "",
    variables: [] as string[],
    is_active: true
  });

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      description: template.description || "",
      html_content: template.html_content,
      variables: template.variables,
      is_active: template.is_active
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.html_content) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const url = editingTemplate
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-templates/${editingTemplate.id}`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-templates`;

      const response = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error);
      }

      toast.success(`Template ${editingTemplate ? 'atualizado' : 'criado'} com sucesso!`);
      setEditingTemplate(null);
      setFormData({ name: "", subject: "", description: "", html_content: "", variables: [], is_active: true });
      onUpdate();

    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-templates/${templateId}?password=${password}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error);
      }

      toast.success('Template deletado com sucesso!');
      onUpdate();

    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar template');
    }
  };

  if (editingTemplate !== null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {editingTemplate?.id ? 'Editar Template' : 'Novo Template'}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome (slug)</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="boas_vindas"
                disabled={!!editingTemplate?.id}
              />
            </div>
            <div>
              <Label>Assunto</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Bem-vindo ao ReUNE!"
              />
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Template de boas-vindas para novos leads"
            />
          </div>

          <div>
            <Label>HTML do Template</Label>
            <Textarea
              value={formData.html_content}
              onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
              placeholder="<html>...</html>"
              className="font-mono text-xs h-64"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use variáveis com: {{nome}}, {{email}}, etc.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="bg-gradient-to-r from-amber-500 to-purple-500">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Templates</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingTemplate({} as EmailTemplate);
            setFormData({ name: "", subject: "", description: "", html_content: "", variables: [], is_active: true });
          }}
          className="bg-gradient-to-r from-amber-500 to-purple-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{template.subject}</CardTitle>
                    <CardDescription className="text-xs mt-1">{template.description}</CardDescription>
                  </div>
                  <Badge variant={template.is_active ? "default" : "secondary"} className="text-xs">
                    {template.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
