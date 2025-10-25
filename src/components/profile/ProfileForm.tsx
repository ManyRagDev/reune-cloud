import { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Camera, Check, X, Lock } from 'lucide-react';
import { ChangePasswordDialog } from './ChangePasswordDialog';

const profileSchema = z.object({
  display_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  username: z.string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(20, 'Username deve ter no máximo 20 caracteres')
    .regex(/^[a-z0-9]+$/, 'Apenas letras minúsculas e números são permitidos'),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  favorite_event_type: z.string().optional(),
  language: z.string().optional(),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
  allow_search_by_username: z.boolean(),
  accept_notifications: z.boolean(),
  terms_accepted: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const EVENT_TYPES = [
  'Churrasco',
  'Pizza',
  'Jantar',
  'Almoço',
  'Lanche',
  'Confraternização',
  'Aniversário',
  'Reunião',
  'Outro',
];

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function ProfileForm() {
  const { user } = useAuth();
  const { profile, loading, completion, updateProfile, uploadAvatar, checkUsernameAvailable } = useProfile();
  const [saving, setSaving] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      allow_search_by_username: true,
      accept_notifications: false,
      terms_accepted: false,
      country: 'Brasil',
      language: 'pt-BR',
    },
  });

  const watchedUsername = watch('username');
  const termsAccepted = watch('terms_accepted');
  
  // Verificar se o usuário já aceitou os termos anteriormente
  const alreadyAcceptedTerms = !!profile?.terms_accepted_at;

  // Ref para controlar a última requisição e evitar race conditions
  const lastUsernameCheckRef = useRef<string>('');
  const checkTimeoutRef = useRef<NodeJS.Timeout>();

  // Verificar disponibilidade de username com debounce e controle de race condition
  const verifyUsernameAvailability = useCallback(async (username: string) => {
    // Normalizar username
    const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Validações básicas
    if (!normalizedUsername || normalizedUsername.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    // Se é o username atual, não precisa verificar
    if (normalizedUsername === profile?.username) {
      setUsernameAvailable(true);
      setCheckingUsername(false);
      return;
    }

    // Marcar como verificando
    setCheckingUsername(true);
    
    // Guardar qual username estamos verificando
    lastUsernameCheckRef.current = normalizedUsername;

    try {
      const available = await checkUsernameAvailable(normalizedUsername);
      
      // Apenas atualizar se esta ainda é a última verificação solicitada
      if (lastUsernameCheckRef.current === normalizedUsername) {
        setUsernameAvailable(available);
        setCheckingUsername(false);
      }
    } catch (error) {
      // Apenas atualizar se esta ainda é a última verificação solicitada
      if (lastUsernameCheckRef.current === normalizedUsername) {
        setUsernameAvailable(false);
        setCheckingUsername(false);
      }
    }
  }, [profile?.username, checkUsernameAvailable]);

  // Efeito com debounce para verificar username
  useEffect(() => {
    // Limpar timeout anterior
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    // Se não há username, limpar estado
    if (!watchedUsername) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    // Configurar novo timeout (debounce de 500ms)
    checkTimeoutRef.current = setTimeout(() => {
      verifyUsernameAvailability(watchedUsername);
    }, 500);

    // Cleanup
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [watchedUsername, verifyUsernameAvailability]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB');
      return;
    }

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    await uploadAvatar(file);
  };

  const onSubmit = async (data: ProfileFormData) => {
    // Validar se termos foram aceitos (apenas se ainda não foram)
    if (!alreadyAcceptedTerms && !data.terms_accepted) {
      return;
    }

    setSaving(true);

    const updates = {
      display_name: data.display_name,
      username: data.username.toLowerCase(),
      phone: data.phone || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      favorite_event_type: data.favorite_event_type || null,
      language: data.language || null,
      bio: data.bio || null,
      allow_search_by_username: data.allow_search_by_username,
      accept_notifications: data.accept_notifications,
      terms_accepted_at: data.terms_accepted && !profile?.terms_accepted_at ? new Date().toISOString() : profile?.terms_accepted_at,
    };

    await updateProfile(updates);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getInitials = () => {
    if (profile?.display_name) {
      const names = profile.display_name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : profile.display_name.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progresso do perfil */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Completude do Perfil</Label>
              <span className="text-sm font-medium text-primary">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Complete seu perfil para aproveitar todas as funcionalidades
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Foto de perfil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label>Foto de Perfil</Label>
              <p className="text-sm text-muted-foreground mb-2">
                PNG, JPG ou JPEG (max 2MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Alterar Foto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identificação */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">Identificação</h3>
          
          <div className="space-y-2">
            <Label htmlFor="display_name">Nome Completo *</Label>
            <Input
              id="display_name"
              {...register('display_name')}
              disabled={saving}
            />
            {errors.display_name && (
              <p className="text-sm text-destructive">{errors.display_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nome de Usuário *</Label>
            <div className="relative">
              <Input
                id="username"
                {...register('username')}
                disabled={saving}
                className="pr-10"
                onChange={(e) => {
                  // Normalizar: apenas letras minúsculas e números
                  e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                  register('username').onChange(e);
                }}
              />
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
              {!checkingUsername && usernameAvailable !== null && watchedUsername && watchedUsername.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameAvailable ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-destructive" />
                  )}
                </div>
              )}
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
            {!checkingUsername && usernameAvailable === false && watchedUsername && watchedUsername.length >= 3 && (
              <p className="text-sm text-destructive">Este username já está em uso</p>
            )}
            {!checkingUsername && usernameAvailable === true && watchedUsername && watchedUsername.length >= 3 && (
              <p className="text-sm text-green-600">Username disponível!</p>
            )}
            <p className="text-xs text-muted-foreground">
              Apenas letras (a-z) e números (0-9), 3-20 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...register('bio')}
              disabled={saving}
              rows={3}
              placeholder="Conte um pouco sobre você..."
            />
            {errors.bio && (
              <p className="text-sm text-destructive">{errors.bio.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contato e Segurança */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">Contato e Segurança</h3>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              disabled={saving}
              placeholder="(00) 00000-0000"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              O e-mail não pode ser alterado
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setPasswordDialogOpen(true)}
            className="w-full"
          >
            <Lock className="w-4 h-4 mr-2" />
            Alterar Senha
          </Button>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="accept_notifications"
              checked={watch('accept_notifications')}
              onCheckedChange={(checked) => setValue('accept_notifications', checked as boolean)}
            />
            <Label htmlFor="accept_notifications" className="text-sm font-normal cursor-pointer">
              Aceito receber notificações por e-mail ou WhatsApp
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Localização e Preferências */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">Localização e Preferências</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                {...register('city')}
                disabled={saving}
                placeholder="São Paulo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Select
                value={watch('state') || ''}
                onValueChange={(value) => setValue('state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              {...register('country')}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="favorite_event_type">Tipo de Evento Favorito</Label>
            <Select
              value={watch('favorite_event_type') || ''}
              onValueChange={(value) => setValue('favorite_event_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu favorito" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Select
              value={watch('language') || 'pt-BR'}
              onValueChange={(value) => setValue('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allow_search_by_username"
              checked={watch('allow_search_by_username')}
              onCheckedChange={(checked) => setValue('allow_search_by_username', checked as boolean)}
            />
            <Label htmlFor="allow_search_by_username" className="text-sm font-normal cursor-pointer">
              Permitir que outros me encontrem por nome de usuário
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Termos e Condições */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms_accepted"
              checked={alreadyAcceptedTerms || watch('terms_accepted')}
              onCheckedChange={(checked) => setValue('terms_accepted', checked as boolean)}
              disabled={alreadyAcceptedTerms}
            />
            <Label 
              htmlFor="terms_accepted" 
              className={`text-sm font-normal leading-relaxed ${alreadyAcceptedTerms ? 'cursor-default' : 'cursor-pointer'}`}
            >
              Li e aceito os{' '}
              <a href="#" className="text-primary hover:underline">
                Termos de Uso
              </a>{' '}
              e a{' '}
              <a href="#" className="text-primary hover:underline">
                Política de Privacidade
              </a>
            </Label>
          </div>
          {!alreadyAcceptedTerms && !termsAccepted && (
            <p className="text-sm text-muted-foreground">
              * Você deve aceitar os termos para salvar seu perfil pela primeira vez
            </p>
          )}
          {alreadyAcceptedTerms && (
            <p className="text-xs text-muted-foreground">
              ✓ Você já aceitou os Termos de Uso e a Política de Privacidade em {new Date(profile.terms_accepted_at).toLocaleDateString('pt-BR')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={saving || (!alreadyAcceptedTerms && !termsAccepted) || (usernameAvailable === false)}
          size="lg"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Modal de alteração de senha */}
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </form>
  );
}
