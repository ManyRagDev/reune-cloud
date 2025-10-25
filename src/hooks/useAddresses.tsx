import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Address {
  id: string;
  user_id: string;
  nickname: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useAddresses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao carregar endereços",
        description: err?.message || "Não foi possível carregar os endereços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async (address: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('user_addresses')
        .insert([{ ...address, user_id: user.id }]);

      if (error) throw error;

      toast({
        title: "Endereço adicionado!",
        description: "Seu endereço foi salvo com sucesso.",
      });

      await fetchAddresses();
      return { success: true };
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao adicionar endereço",
        description: err?.message || "Não foi possível adicionar o endereço.",
        variant: "destructive",
      });
      return { success: false, error: err?.message };
    }
  };

  const updateAddress = async (id: string, updates: Partial<Address>) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('user_addresses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Endereço atualizado!",
        description: "Suas alterações foram salvas.",
      });

      await fetchAddresses();
      return { success: true };
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao atualizar endereço",
        description: err?.message || "Não foi possível atualizar o endereço.",
        variant: "destructive",
      });
      return { success: false, error: err?.message };
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Endereço removido!",
        description: "O endereço foi excluído com sucesso.",
      });

      await fetchAddresses();
      return { success: true };
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Erro ao remover endereço",
        description: err?.message || "Não foi possível remover o endereço.",
        variant: "destructive",
      });
      return { success: false, error: err?.message };
    }
  };

  const setPrimaryAddress = async (id: string) => {
    return updateAddress(id, { is_primary: true });
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  return {
    addresses,
    loading,
    addAddress,
    updateAddress,
    deleteAddress,
    setPrimaryAddress,
    refetch: fetchAddresses,
  };
};
