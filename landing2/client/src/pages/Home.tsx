import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/DashboardHeader';
import { EventTimeline } from '@/components/EventTimeline';
import { EventCard, Event } from '@/components/EventCard';
import { InsightCard } from '@/components/InsightCard';
import { Confetti } from '@/components/Confetti';
import { ChevronDown } from 'lucide-react';

/**
 * ReUNE Dashboard - Feed Social para Eventos
 * Design: Modernismo Playful com Gradientes Orgânicos
 * Tipografia: Poppins (títulos), Inter (corpo)
 * Cores: Laranja #F59E0B, Rosa #EC4899, Roxo #8B5CF6, Verde #10B981
 */

// Mock data - URLs de imagens geradas
const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: '🥩 Churrascão do Sábado',
    emoji: '🔥',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/rS4649vJ7Kvq5LmQZ2mnJP/sandbox/tiCKc2ulrsV4oddGLFy4M2-img-1_1770528177000_na1fn_Y2h1cnJhc2NvLWhlcm8.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvclM0NjQ5dko3S3ZxNUxtUVoybW5KUC9zYW5kYm94L3RpQ0tjMnVscnNWNG9kZEdMRnk0TTItaW1nLTFfMTc3MDUyODE3NzAwMF9uYTFmbl9ZMmgxY25KaGMyTnZMV2hsY204LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Gn0nccFkmVo3Zxj8dc-72uVYwLIswA7Apd5z1coUlck4Ir3gioGChp2swddcbl4Jfsr1hNadPQBnojyumjPdgrWFIa6I67cXdOmpxhuIGSGOBXZMKOUXuZeOheHDKL8I0y7ynQyaIsGWWq6eBQscNfrs0Uf7fqRzHMK92qeXGpoRwz8ByCW9kyYpX6oRtVstY86W6e~5pNIvpkptD4Y-jk~2eqHiZ6v4CotRWY~ImUjO-guHFAa4vYdBWxaWGZpkoENem-CxWsy2nkLBBMn1M4tOcgumYgC8g6AsBarqRj9qylnJ9Heiu2iCO2sSov7ZzFm72cQlqaLFZKEV2X~fSg__',
    location: 'Parque da Cidade',
    time: '12:00 - 18:00',
    confirmedCount: 15,
    totalCount: 18,
    completedItems: 18,
    totalItems: 18,
    status: 'happening',
  },
  {
    id: '2',
    title: '🎂 Aniversário da Maria',
    emoji: '🎂',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/rS4649vJ7Kvq5LmQZ2mnJP/sandbox/tiCKc2ulrsV4oddGLFy4M2-img-2_1770528177000_na1fn_YW5pdmVyc2FyaW8taGVybw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvclM0NjQ5dko3S3ZxNUxtUVoybW5KUC9zYW5kYm94L3RpQ0tjMnVscnNWNG9kZEdMRnk0TTItaW1nLTJfMTc3MDUyODE3NzAwMF9uYTFmbl9ZVzVwZG1WeWMyRnlhVzh0YUdWeWJ3LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=GdKQbTT5SfSqoXEue-jLC7WtbKUX4d1OcJDAQKoJHxZ9OExhjrTF9vVTGqsRd7Iljq5jNEe5ReRgSzYkCdOdNQ6PMEmE0i4r~PfhgeSWfU9ipQhCBOnJH4IzWy-QfWhMu~nQnC0hazrJB9xNvFKVe9uj4scpA7fNEBLWxmHt9x2S12RosobgyyECwLdt8-A8uGALxe1L3VpzBmU01ueT2R-tTORTXmTTImSJETEPDWvVT87h9LN3YndLdSXTiNToVemx0GtMnvPR6hTjtQVr5-vC96tAZvpqDlhiajn8-Iv3PSXGBh8j-sPhtlXxdmRi9-c0AT4HMutt7wHtnc~zDg__',
    location: 'Casa da Maria',
    time: '18:00 - 23:00',
    confirmedCount: 12,
    totalCount: 20,
    completedItems: 15,
    totalItems: 18,
    status: 'upcoming',
    daysUntil: 2,
    pendingItems: 3,
  },
  {
    id: '3',
    title: '🍔 Almoço com o Time',
    emoji: '🍔',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/rS4649vJ7Kvq5LmQZ2mnJP/sandbox/tiCKc2ulrsV4oddGLFy4M2-img-3_1770528178000_na1fn_YWxtb8Onby1oZXJv.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvclM0NjQ5dko3S3ZxNUxtUVoybW5KUC9zYW5kYm94L3RpQ0tjMnVscnNWNG9kZEdMRnk0TTItaW1nLTNfMTc3MDUyODE3ODAwMF9uYTFmbl9ZV3h0YjhPbmJ5MW9aWEp2LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=XkWb4tjtN9HHzQ1ZgvuJ3Ep7CpAwuUntdKo7k1vyMsW6t95DFbWzB4lp45Pa7u9NScWweLpctAYy7fd0b60coZ~bXIdYeer0E6RJGWeSMX2A6uiWxtw91JlWYsL4O4hYB8jHnWqa-NK9RByr8qecfNlvDmrPlXzKC~~KyVAc0cSw7cIQReGPcXH5UE4BHCpdLoTMgDv9dstR1afmBPO2NlSyPyDabh-3LRDAkH7u6KVIhUGaHiTTsSPn77vKA3xjmzrKb4SR40ISWJe1b6pEJE~IFqY2B0uiAoglJjTXGLaVCnzTQkHcaFbpn3rAZq5qiiSXWQloc1soG5V93MjyEA__',
    location: 'Restaurante Central',
    time: '12:30 - 14:00',
    confirmedCount: 8,
    totalCount: 10,
    completedItems: 10,
    totalItems: 10,
    status: 'upcoming',
    daysUntil: 4,
  },
  {
    id: '4',
    title: '🎉 Festa Noturna',
    emoji: '🎉',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/rS4649vJ7Kvq5LmQZ2mnJP/sandbox/tiCKc2ulrsV4oddGLFy4M2-img-4_1770528179000_na1fn_ZmVzdGEtbm90dXJuYS1oZXJv.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvclM0NjQ5dko3S3ZxNUxtUVoybW5KUC9zYW5kYm94L3RpQ0tjMnVscnNWNG9kZEdMRnk0TTItaW1nLTRfMTc3MDUyODE3OTAwMF9uYTFmbl9abVZ6ZEdFdGJtOTBkWEp1WVMxb1pYSnYucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=HENQMZmdly2b80G-oQvrxUoYZ8urQo1evES~-0mav~FS2ycI8OgYgYPcbg0S7aO-z87YGYt0nXa3wdT33Y3cQ3paHQlnSMvdTzmWOyBtnVThMuKHDmw9CsHmR-cTB4MKvSYCo0edFq0xkfq8HltIiFlk-VpuxiOvIgTb0Cqb74-u~tO8H7rIfGwvnjBiB6PyylMeTqSC1FG5x7RC5WVBRvpcd97OIeMtfNgZMEJ-uOJvMhU6-ET2Q6eFBkar8PWxzC5YBaV68BMzjUk3QeoHTlovp42HgUObCtaS9SVn9mwISYPBKZCDm2N3Ixjp1GqIIVQsrGxQuhyv9HHlwc8gaQ__',
    location: 'Boate do Centro',
    time: '22:00 - 04:00',
    confirmedCount: 20,
    totalCount: 25,
    completedItems: 12,
    totalItems: 15,
    status: 'upcoming',
    daysUntil: 6,
    pendingItems: 3,
  },
  {
    id: '5',
    title: '🧺 Piquenique no Parque',
    emoji: '🧺',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/rS4649vJ7Kvq5LmQZ2mnJP/sandbox/tiCKc2ulrsV4oddGLFy4M2-img-5_1770528181000_na1fn_cGlxdWVuaXF1ZS1oZXJv.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvclM0NjQ5dko3S3ZxNUxtUVoybW5KUC9zYW5kYm94L3RpQ0tjMnVscnNWNG9kZEdMRnk0TTItaW1nLTVfMTc3MDUyODE4MTAwMF9uYTFmbl9jR2x4ZFdWdWFYRjFaUzFvWlhKdi5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=WeRG8QFxbNhVhAJLFEcJjnDSzOLr8NrN6y6kKiF4HyvOXEEQfDLwh-pbrVA3VwiC3ty0VUcQMWv7eyhBVK2tey8fQDSMWt99s7FajoVbZrlPeV5iCPJlnp8TGv860mN2UGM9i2R-YNlvkDvwIgAtcMHrWC8hXtLu--jg6jSJDagIstbRs8~~uPUw68wiaW7ZoMWYkJEI1BZSYU7S2S92-4eU848PtfCj1OF-GDooUAmKuRBYFUOXdibcQEMbny8MB2ZlGAlIYsle1XiTDySuHiHaNmbOB-H02odAdnySZ3~Iu2iGlgCzyN7Kp5-naOlo5Kb33VfO-wFdwpUDFjw8ww__',
    location: 'Parque Estadual',
    time: '10:00 - 16:00',
    confirmedCount: 6,
    totalCount: 8,
    completedItems: 8,
    totalItems: 8,
    status: 'past',
  },
];

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showConfetti, setShowConfetti] = useState(false);
  const [expandedPastEvents, setExpandedPastEvents] = useState(false);

  // Generate timeline days
  const generateTimelineDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
      const dayNumber = date.getDate();

      // Count events for this day
      const eventsForDay = MOCK_EVENTS.filter((e) => {
        const eventDate = new Date(e.id === '1' ? today : new Date(today.getTime() + i * 24 * 60 * 60 * 1000));
        return eventDate.toDateString() === date.toDateString();
      });

      days.push({
        date,
        dayName,
        dayNumber,
        eventCount: eventsForDay.length,
        emoji: eventsForDay[0]?.emoji || '',
        hasEvents: eventsForDay.length > 0,
      });
    }
    return days;
  };

  const timelineDays = generateTimelineDays();

  // Filter events by status
  const happeningEvents = MOCK_EVENTS.filter((e) => e.status === 'happening');
  const upcomingEvents = MOCK_EVENTS.filter((e) => e.status === 'upcoming');
  const pastEvents = MOCK_EVENTS.filter((e) => e.status === 'past');

  // Trigger confetti when event is complete
  useEffect(() => {
    if (happeningEvents.some((e) => e.completedItems === e.totalItems)) {
      setShowConfetti(true);
      toast.success('Tá tudo pronto! 🎉', {
        description: 'Todos os itens foram confirmados!',
      });
    }
  }, []);

  const handleViewDetails = (event: Event) => {
    toast.info(`Abrindo detalhes de ${event.title}`);
  };

  const handleOpenChat = (event: Event) => {
    toast.info(`Chat do ${event.title} aberto`);
  };

  const handleCreateEvent = () => {
    toast.info('Criar novo role - Feature coming soon');
  };

  const handleNotifications = () => {
    toast.info('Notificações - Feature coming soon');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <DashboardHeader
        userName="João Silva"
        userAvatar="https://api.dicebear.com/7.x/avataaars/svg?seed=João"
        notificationCount={3}
        onCreateEvent={handleCreateEvent}
        onNotifications={handleNotifications}
      />

      {/* Timeline */}
      <div className="mt-20">
        <EventTimeline
          days={timelineDays}
          onDaySelect={setSelectedDate}
          selectedDate={selectedDate}
        />
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Happening now section */}
        {happeningEvents.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">🔥</span>
              Acontecendo agora
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {happeningEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  size="large"
                  onViewDetails={handleViewDetails}
                  onOpenChat={handleOpenChat}
                />
              ))}
            </div>
          </section>
        )}

        {/* Insight card */}
        <section className="mb-12">
          <InsightCard
            emoji="🎊"
            title="Você já organizou 12 roles!"
            description="Que tal convidar mais gente para o próximo? Quanto mais amigos, mais diversão!"
            actionLabel="Ver convites"
            backgroundColor="from-orange-100 to-yellow-100"
          />
        </section>

        {/* Upcoming events section */}
        {upcomingEvents.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">📅</span>
              Próximos 7 dias
            </h2>
            <div className="space-y-8">
              {upcomingEvents.map((event) => (
                <div key={event.id}>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                    {event.daysUntil === 1 ? 'Amanhã' : `${event.daysUntil} dias`}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <EventCard
                      event={event}
                      size="medium"
                      onViewDetails={handleViewDetails}
                      onOpenChat={handleOpenChat}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Another insight */}
        <section className="mb-12">
          <InsightCard
            emoji="💡"
            title="Seus churrascos sempre têm cerveja, mas você esquece gelo 😅"
            description="Que tal adicionar gelo à lista de compras para o próximo churrasco?"
            actionLabel="Adicionar à lista"
            backgroundColor="from-purple-100 to-pink-100"
          />
        </section>

        {/* Past events section */}
        {pastEvents.length > 0 && (
          <section className="mb-12">
            <button
              onClick={() => setExpandedPastEvents(!expandedPastEvents)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-gray-300 transition-colors mb-4"
            >
              <h2 className="font-heading text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">✨</span>
                Como foi o último role?
              </h2>
              <ChevronDown
                className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${
                  expandedPastEvents ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedPastEvents && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    size="small"
                    onViewDetails={handleViewDetails}
                    onOpenChat={handleOpenChat}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Confetti animation */}
      {showConfetti && <Confetti />}
    </div>
  );
}
