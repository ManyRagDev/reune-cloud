import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Event {
  id: number;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  location: string | null;
  user_id: string;
  max_attendees: number | null;
  is_public: boolean | null;
  status: string | null;
}

interface EventOrganizer {
  id: string;
  user_id: string;
  added_by: string;
  added_at: string;
}

export const useEvent = (eventId: string) => {
  const eventIdNumber = parseInt(eventId);
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [organizers, setOrganizers] = useState<EventOrganizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verifica se o usuário atual é organizador do evento
  const isOrganizer = () => {
    if (!user || !event) return false;
    
    // É criador do evento
    if (event.user_id === user.id) return true;
    
    // É co-organizador
    return organizers.some(org => org.user_id === user.id);
  };

  // Busca dados do evento
  const fetchEvent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('table_reune')
        .select('*')
        .eq('id', eventIdNumber)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar evento');
    } finally {
      setLoading(false);
    }
  };

  // Busca co-organizadores do evento
  const fetchOrganizers = async () => {
    try {
      const { data, error } = await supabase
        .from('event_organizers')
        .select('*')
        .eq('event_id', eventIdNumber);

      if (error) throw error;
      setOrganizers(data || []);
    } catch (err) {
      console.error('Erro ao buscar organizadores:', err);
    }
  };

  // Adiciona co-organizador
  const addOrganizer = async (userId: string) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('event_organizers')
        .insert({
          event_id: eventIdNumber,
          user_id: userId,
          added_by: user.id
        });

      if (error) throw error;
      
      await fetchOrganizers(); // Atualiza a lista
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erro ao adicionar organizador' };
    }
  };

  // Remove co-organizador
  const removeOrganizer = async (organizerId: string) => {
    try {
      const { error } = await supabase
        .from('event_organizers')
        .delete()
        .eq('id', organizerId);

      if (error) throw error;
      
      await fetchOrganizers(); // Atualiza a lista
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erro ao remover organizador' };
    }
  };

  useEffect(() => {
    if (eventId && !isNaN(eventIdNumber)) {
      fetchEvent();
      fetchOrganizers();
    }
  }, [eventId, eventIdNumber]);

  return {
    event,
    organizers,
    loading,
    error,
    isOrganizer: isOrganizer(),
    addOrganizer,
    removeOrganizer,
    refetch: () => {
      fetchEvent();
      fetchOrganizers();
    }
  };
};