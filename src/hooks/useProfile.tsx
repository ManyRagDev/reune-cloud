import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  favorite_event_type: string | null;
  language: string | null;
  allow_search_by_username: boolean | null;
  accept_notifications: boolean | null;
  terms_accepted_at: string | null;
  bio: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [completion, setCompletion] = useState(0);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Se não existe perfil, criar um
      if (!profileData) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: user.id }])
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
      } else {
        setProfile(profileData);
      }

      // Buscar completude do perfil
      const { data: completionData } = await supabase
        .rpc('get_profile_completion');

      if (completionData !== null) {
        setCompletion(completionData);
      }
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao carregar perfil",
        description: err?.message || "Não foi possível carregar o perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    if (!username || username.length < 3) return false;

    try {
      const { data, error } = await supabase
        .rpc('check_username_available', { desired_username: username.toLowerCase() });

      if (error) throw error;
      return data === true;
    } catch (error) {
      return false;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      // Converter username para lowercase se fornecido
      if (updates.username) {
        updates.username = updates.username.toLowerCase();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });

      // Recarregar perfil
      await fetchProfile();
      return { success: true };
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao atualizar perfil",
        description: err?.message || "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
      return { success: false, error: err?.message };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar perfil com nova URL
      await updateProfile({ avatar_url: publicUrl });

      return { success: true, url: publicUrl };
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao fazer upload",
        description: err?.message || "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
      return { success: false, error: err?.message };
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    completion,
    updateProfile,
    uploadAvatar,
    checkUsernameAvailable,
    refetch: fetchProfile,
  };
};
