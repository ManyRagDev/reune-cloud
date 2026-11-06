import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type LucideIcon, ArrowLeft, AlertTriangle, MapPinned, Home, Sparkles, Calendar as CalendarIcon, Clock, Flame, UtensilsCrossed, Cake, Briefcase, Package, Plus, X, Moon, Sun, Users, Gift } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { EventInviteSelector, Invitee } from '@/components/events/EventInviteSelector';
import { AddressSelector } from '@/components/events/AddressSelector';
import { Address } from '@/hooks/useAddresses';
import { EventTemplate, templates } from '@/data/templates';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NBLight, NBDark, NBPalette, nb } from '@/lib/neobrutalism';
import { GoogleAddressAutocomplete, SelectedPlace } from '@/components/maps/GoogleAddressAutocomplete';
import { EventMapPreview } from '@/components/maps/EventMapPreview';

interface ManualItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface CreateEventProps {
  onBack: () => void;
  onCreate: () => void;
  initialData?: EventTemplate | null;
  defaultSecretSanta?: boolean;
}

const templateIcons: Record<string, LucideIcon> = {
  churrasco: Flame,
  jantar: UtensilsCrossed,
  aniversario: Cake,
  reuniao: Briefcase,
};

const templateColors = ['#FFD93D', '#A8D8FF', '#FF69B4', '#B8F3D0'];

const CreateEvent = ({ onBack, onCreate, initialData, defaultSecretSanta = false }: CreateEventProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(initialData || null);
  const [title, setTitle] = useState(initialData?.title || '');
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState(initialData?.description || '');
  const [peopleCount, setPeopleCount] = useState<number>(10);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [hasSecretSanta, setHasSecretSanta] = useState<boolean>(defaultSecretSanta);
  const [secretSantaMinValue, setSecretSantaMinValue] = useState<number>(30);
  const [secretSantaMaxValue, setSecretSantaMaxValue] = useState<number>(100);
  const [selectedInvitees, setSelectedInvitees] = useState<Invitee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('un');

  /* ── Dark mode ──────────────────────── */
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("reune-v3-theme");
      if (saved) return saved === "dark";
    }
    return false;
  });
  useEffect(() => { localStorage.setItem("reune-v3-theme", isDark ? "dark" : "light"); }, [isDark]);
  const C: NBPalette = isDark ? NBDark : NBLight;

  const addManualItem = () => {
    if (!newItemName.trim()) return;
    const newItem: ManualItem = { id: crypto.randomUUID(), name: newItemName.trim(), quantity: newItemQuantity, unit: newItemUnit };
    setManualItems([...manualItems, newItem]);
    setNewItemName('');
    setNewItemQuantity(1);
    setNewItemUnit('un');
    toast({ title: "Item adicionado", description: `"${newItem.name}" foi adicionado à lista.` });
  };

  const removeManualItem = (itemId: string) => { setManualItems(manualItems.filter(item => item.id !== itemId)); };

  const getAllItems = () => {
    const templateItems = selectedTemplate?.defaultItems?.map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit, category: item.category })) || [];
    const manualItemsMapped = manualItems.map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit, category: 'geral' }));
    return [...templateItems, ...manualItemsMapped];
  };

  useEffect(() => {
    if (initialData) { setSelectedTemplate(initialData); setTitle(initialData.title); setDescription(initialData.description); }
  }, [initialData]);

  const handleTemplateSelect = (template: EventTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.title);
    setDescription(template.description);
    toast({ title: "Modelo aplicado", description: `O modelo "${template.title}" foi selecionado.` });
  };

  const checkResidentialLocation = (loc: string) => { return /(casa|residência|apt|apartamento|rua|avenida|av\.|r\.)/i.test(loc); };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setShowLocationWarning(isPublic && checkResidentialLocation(value));
    if (selectedAddressId) setSelectedAddressId(null);
  };

  const handlePlaceSelect = (place: SelectedPlace) => {
    setLocation(place.address);
    setLatitude(place.latitude);
    setLongitude(place.longitude);
    setPlaceId(place.placeId);
    setShowLocationWarning(isPublic && checkResidentialLocation(place.address));
    if (selectedAddressId) setSelectedAddressId(null);
  };

  const handleAddressSelect = (address: Address) => {
    const formattedAddress = `${address.nickname} — ${address.street}, ${address.number}${address.complement ? ', ' + address.complement : ''}, ${address.city}/${address.state}`;
    setLocation(formattedAddress);
    setSelectedAddressId(address.id);
    setUseManualLocation(false);
    setShowLocationWarning(isPublic && checkResidentialLocation(formattedAddress));
    toast({ title: "Endereço aplicado", description: `Usando "${address.nickname}" como local do evento.` });
  };

  const handleToggleManualLocation = () => {
    if (!useManualLocation) { setLocation(''); setSelectedAddressId(null); }
    setUseManualLocation(!useManualLocation);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Erro", description: "Você precisa estar logado para criar um evento.", variant: "destructive" }); return; }
    if (!date) { toast({ title: "Data obrigatória", description: "Por favor, selecione uma data para o evento.", variant: "destructive" }); return; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (date < today) { toast({ title: "Data inválida", description: "Não é possível criar eventos em datas passadas.", variant: "destructive" }); return; }

    setLoading(true);
    try {
      const eventDescription = description || null;
      const formattedDate = format(date, 'yyyy-MM-dd');
      const { data: eventData, error } = await supabase.from('table_reune').insert({
        title,
        event_date: formattedDate,
        event_time: time,
        location,
        address: location || null,
        description: eventDescription,
        user_id: user.id,
        is_public: isPublic,
        status: 'created',
        created_by_ai: false,
        qtd_pessoas: peopleCount,
        tipo_evento: selectedTemplate?.slug || 'evento',
        categoria_evento: hasSecretSanta ? 'amigo_secreto' : (selectedTemplate?.slug || 'geral'),
        latitude,
        longitude,
        place_id: placeId,
        public_location: isPublic && checkResidentialLocation(location) ? 'Local a confirmar com organizador' : null
      }).select().single();

      if (error) throw error;

      if (hasSecretSanta && eventData) {
        try {
          await supabase.from("event_dynamics").insert({
            event_id: eventData.id,
            type: "secret_santa",
          });

          await supabase.from("event_secret_santa").insert({
            event_id: eventData.id,
            min_value: secretSantaMinValue,
            max_value: secretSantaMaxValue,
            draw_date: `${formattedDate}T20:00:00`,
            has_drawn: false,
          });
        } catch (ssErr) {
          console.error("Erro ao registrar Amigo Secreto:", ssErr);
        }
      }

      const allItems = getAllItems();
      if (allItems.length > 0 && eventData) {
        const itemsToInsert = allItems.map(item => ({ event_id: eventData.id, nome_item: item.name, quantidade: item.quantity, unidade: item.unit, categoria: item.category, prioridade: 'B' }));
        const { error: itemsError } = await supabase.from('event_items').insert(itemsToInsert);
        if (itemsError) console.error("Erro ao inserir itens:", itemsError);
      }

      if (selectedInvitees.length > 0 && eventData) {
        for (const invitee of selectedInvitees) {
          try {
            const { data: inviteData, error: inviteError } = await supabase.rpc("process_invitation", {
              _event_id: eventData.id, _invitee_email: invitee.email || null, _invitee_name: invitee.name,
              _is_organizer: false, _invitee_user_id: invitee.user_id || null,
            });
            if (inviteError) { console.error("Erro ao enviar convite para", invitee.email || invitee.name, ":", inviteError); continue; }
            const result = inviteData as any;
            if (!result?.user_exists && result?.invitation_token && invitee.email) {
              const { error: emailError } = await supabase.functions.invoke("send-invitation-email", {
                body: { invitee_email: invitee.email, invitee_name: invitee.name, event_title: title, event_date: date, event_time: time, is_organizer: false, invitation_token: result.invitation_token },
              });
              if (emailError) console.error("Erro ao enviar email para", invitee.email || invitee.name, ":", emailError);
            }
          } catch (err) { console.error("Erro ao processar convite individual:", err); }
        }
      }

      const pendingCount = selectedInvitees.filter(inv => inv.status === "pendente").length;
      const confirmedCount = selectedInvitees.filter(inv => inv.status === "convidado").length;
      let successMessage = "Seu evento foi publicado e já está disponível.";
      if (selectedInvitees.length > 0) {
        if (pendingCount > 0 && confirmedCount > 0) successMessage = `${confirmedCount} amigo(s) convidado(s) e ${pendingCount} convite(s) pendente(s) criado(s).`;
        else if (pendingCount > 0) successMessage = `${pendingCount} convite(s) pendente(s) criado(s).`;
        else successMessage = `${confirmedCount} amigo(s) foram convidados.`;
      }
      toast({ title: "Evento criado com sucesso!", description: successMessage });
      onCreate();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente.";
      toast({ title: "Erro ao criar evento", description: message, variant: "destructive", duration: 5000 });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: C.bg, color: C.text }}>
      {/* ═══ NAVBAR ═══ */}
      <nav
        className={`sticky top-0 z-50 px-4 md:px-8 py-3 ${nb.border} border-t-0 border-x-0 flex items-center justify-between transition-colors duration-300`}
        style={{ backgroundColor: C.bg }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-2 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover}`}
            style={{ backgroundColor: C.sectionBg, color: C.text }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black" style={{ color: C.orange }}>Novo Evento 🎉</h1>
            <p className="text-xs font-bold" style={{ color: C.textMuted, opacity: 0.6 }}>Preencha as infos e bora!</p>
          </div>
        </div>
        <button
          onClick={() => setIsDark(!isDark)}
          className={`p-2 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover}`}
          style={{ backgroundColor: isDark ? C.yellow : C.lavender, color: C.black }}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* ═══ TEMPLATE SELECTOR ═══ */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
          <Label className="mb-3 block text-base font-black flex items-center gap-2" style={{ color: C.text }}>
            <Sparkles className="w-5 h-5" style={{ color: C.orange }} />
            Modelo rápido (opcional)
          </Label>
          <div className="flex flex-wrap gap-3">
            {templates.map((template, index) => {
              const Icon = templateIcons[template.slug] ?? Sparkles;
              const isSelected = selectedTemplate?.slug === template.slug;
              const bgColor = templateColors[index % templateColors.length];
              return (
                <motion.button
                  key={template.slug}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.08 }}
                  whileHover={{ y: -3, rotate: -2 }}
                  onClick={() => handleTemplateSelect(template)}
                  className={`inline-flex items-center gap-2 rounded-xl ${nb.border} ${isSelected ? nb.shadowLg : nb.shadow} ${nb.hover} px-4 py-2 text-sm font-black transition-all`}
                  style={{ backgroundColor: isSelected ? bgColor : C.sectionBg, color: C.black }}
                >
                  <Icon className="h-4 w-4" />
                  {template.title}
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* ═══ MAIN FORM ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <div
            className={`rounded-2xl ${nb.border} ${nb.shadowLg} overflow-hidden transition-colors duration-300`}
            style={{ backgroundColor: C.cardBg }}
          >
            {/* Color strip */}
            <div className="h-3 w-full" style={{ backgroundColor: C.orange }} />

            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl ${nb.border} flex items-center justify-center`} style={{ backgroundColor: C.sky }}>
                  <CalendarIcon className="w-5 h-5" style={{ color: C.black }} />
                </div>
                <div>
                  <h2 className="text-2xl font-black" style={{ color: C.text }}>Detalhes do Evento</h2>
                  <p className="text-sm font-medium" style={{ color: C.textMuted, opacity: 0.6 }}>As infos principais</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-sm font-black" style={{ color: C.text }}>Nome do Evento</Label>
                  <Input
                    id="title" type="text" placeholder="Ex: Churrasco de Domingo 🍖"
                    value={title} onChange={(e) => setTitle(e.target.value)} required
                    className={`h-12 mt-2 rounded-xl ${nb.input} text-base font-bold`}
                    style={{ backgroundColor: C.inputBg, color: C.text, borderColor: C.border }}
                  />
                </div>

                {/* Date/Time/People */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-black flex items-center gap-2" style={{ color: C.text }}>
                      <CalendarIcon className="w-4 h-4" /> Data
                    </Label>
                    <div className="mt-2">
                      <DatePicker value={date} onChange={setDate} placeholder="Escolha a data" disabled={loading} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-black flex items-center gap-2" style={{ color: C.text }}>
                      <Clock className="w-4 h-4" /> Horário
                    </Label>
                    <div className="mt-2">
                      <TimePicker value={time} onChange={setTime} placeholder="Escolha o horário" disabled={loading} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-black flex items-center gap-2" style={{ color: C.text }}>
                      <Users className="w-4 h-4" /> Qtd. Pessoas
                    </Label>
                    <div className="mt-2">
                      <Input
                        type="number"
                        min="1"
                        value={peopleCount}
                        onChange={(e) => setPeopleCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className={`h-12 rounded-xl ${nb.input} text-base font-bold`}
                        style={{ backgroundColor: C.inputBg, color: C.text, borderColor: C.border }}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <Label className="text-sm font-black flex items-center gap-2" style={{ color: C.text }}>
                    <MapPinned className="w-4 h-4" /> Endereço
                  </Label>
                  <div className="space-y-3 mt-2">
                    {!useManualLocation && <AddressSelector onAddressSelect={handleAddressSelect} disabled={loading} />}
                    {useManualLocation ? (
                      <div className="space-y-3">
                        <GoogleAddressAutocomplete
                          value={location}
                          onChange={handleLocationChange}
                          onPlaceSelect={handlePlaceSelect}
                          placeholder="Busque por rua, praça, restaurante ou local..."
                          disabled={loading}
                          palette={C}
                          required
                        />

                        {latitude && longitude && (
                          <div className="mt-2">
                            <EventMapPreview
                              latitude={latitude}
                              longitude={longitude}
                              title={title || "Local do Evento"}
                              editable={true}
                              onPositionChange={({ latitude: lat, longitude: lng }) => {
                                setLatitude(lat);
                                setLongitude(lng);
                              }}
                              height="220px"
                              isDark={isDark}
                              palette={C}
                            />
                          </div>
                        )}

                        <button
                          type="button" onClick={handleToggleManualLocation}
                          className="text-xs font-bold flex items-center gap-1" style={{ color: C.orange }}
                        >
                          <Home className="h-3 w-3" /> Voltar para endereços salvos
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button" onClick={handleToggleManualLocation} disabled={loading}
                        className={`w-full h-12 ${nb.border} ${nb.shadow} ${nb.hover} rounded-xl flex items-center justify-center gap-2 font-black text-sm transition-colors duration-300`}
                        style={{ backgroundColor: C.sectionBg, color: C.text }}
                      >
                        <MapPinned className="h-4 w-4" /> Digitar endereço manualmente
                      </button>
                    )}
                  </div>

                  {showLocationWarning && (
                    <div className={`mt-3 p-3 rounded-xl ${nb.border} text-sm font-bold`} style={{ backgroundColor: C.yellow, color: C.black }}>
                      <AlertTriangle className="h-4 w-4 inline mr-2" />
                      <strong>Atenção:</strong> Endereço residencial em evento público. Apenas a região será exibida para não-convidados.
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-black" style={{ color: C.text }}>Descrição (opcional)</Label>
                  <Textarea
                    id="description" placeholder="Conta mais sobre o evento..."
                    value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                    className={`mt-2 rounded-xl ${nb.input} font-bold`}
                    style={{ backgroundColor: C.inputBg, color: C.text, borderColor: C.border }}
                  />
                </div>

                {/* Items list */}
                <div className="space-y-3">
                  <Label className="text-sm font-black flex items-center gap-2" style={{ color: C.text }}>
                    <Package className="w-4 h-4" /> Lista de Itens (opcional)
                  </Label>

                  {selectedTemplate?.defaultItems && selectedTemplate.defaultItems.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold" style={{ color: C.textMuted, opacity: 0.6 }}>Itens do modelo "{selectedTemplate.title}":</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.defaultItems.map((item, i) => (
                          <div key={`t-${i}`} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${nb.border} text-sm font-bold`} style={{ backgroundColor: C.mint, color: C.black }}>
                            {item.name} <span className="opacity-60">({item.quantity} {item.unit})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {manualItems.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold" style={{ color: C.textMuted, opacity: 0.6 }}>Seus itens:</p>
                      <div className="flex flex-wrap gap-2">
                        {manualItems.map((item) => (
                          <div key={item.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${nb.border} text-sm font-bold`} style={{ backgroundColor: C.sky, color: C.black }}>
                            {item.name} <span className="opacity-60">({item.quantity} {item.unit})</span>
                            <button type="button" onClick={() => removeManualItem(item.id)} className="hover:text-red-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`p-4 rounded-xl ${nb.border} space-y-3`} style={{ backgroundColor: C.sectionBg }}>
                    <Input
                      placeholder="Nome do item..."
                      value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualItem(); } }}
                      className={`h-10 rounded-lg ${nb.input} font-bold`}
                      style={{ backgroundColor: C.inputBg, color: C.text, borderColor: C.border }}
                      disabled={loading}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Input
                        type="number" min="0.1" step="0.1" value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(parseFloat(e.target.value) || 1)}
                        className={`w-20 h-10 rounded-lg ${nb.input} font-bold`}
                        style={{ backgroundColor: C.inputBg, color: C.text, borderColor: C.border }}
                        disabled={loading}
                      />
                      <Select value={newItemUnit} onValueChange={setNewItemUnit} disabled={loading}>
                        <SelectTrigger className={`w-32 h-10 rounded-lg ${nb.border} font-bold`} style={{ backgroundColor: C.inputBg, color: C.text }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="un">Unidade(s)</SelectItem>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="g">Grama(s)</SelectItem>
                          <SelectItem value="l">Litro(s)</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="pct">Pacote(s)</SelectItem>
                          <SelectItem value="cx">Caixa(s)</SelectItem>
                          <SelectItem value="dz">Dúzia(s)</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        type="button" onClick={addManualItem} disabled={!newItemName.trim() || loading}
                        className={`h-10 px-4 rounded-lg ${nb.border} ${nb.shadow} ${nb.hover} font-black text-sm flex items-center gap-2 disabled:opacity-50`}
                        style={{ backgroundColor: C.mint, color: C.black }}
                      >
                        <Plus className="w-4 h-4" /> Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                {/* ═══ AMIGO SECRETO OPT-IN ═══ */}
                <div
                  className={`p-5 rounded-2xl ${nb.border} ${nb.shadow} transition-all`}
                  style={{ backgroundColor: hasSecretSanta ? C.pink : C.sectionBg }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${nb.border} flex items-center justify-center`} style={{ backgroundColor: C.yellow }}>
                        <Gift className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <h3 className="text-base font-black" style={{ color: C.text }}>
                          Ativar Amigo Secreto nesta festa? 🎁
                        </h3>
                        <p className="text-xs font-bold opacity-75" style={{ color: C.text }}>
                          Sorteio 100% justo, lista de presentes e revelação na festa!
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      id="hasSecretSanta"
                      checked={hasSecretSanta}
                      onCheckedChange={(checked) => setHasSecretSanta(checked === true)}
                      className="w-6 h-6 rounded-lg border-[2px] border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
                    />
                  </div>

                  {hasSecretSanta && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t-2 border-black/15 space-y-3"
                    >
                      <Label className="text-xs font-black uppercase tracking-wider block" style={{ color: C.text }}>
                        Faixa sugerida de preço do presente:
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-bold" style={{ color: C.text }}>Valor Mínimo (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={secretSantaMinValue}
                            onChange={(e) => setSecretSantaMinValue(parseFloat(e.target.value) || 0)}
                            className={`h-11 mt-1 rounded-xl ${nb.input} font-bold`}
                            style={{ backgroundColor: C.inputBg, color: C.text, borderColor: C.border }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-bold" style={{ color: C.text }}>Valor Máximo (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={secretSantaMaxValue}
                            onChange={(e) => setSecretSantaMaxValue(parseFloat(e.target.value) || 0)}
                            className={`h-11 mt-1 rounded-xl ${nb.input} font-bold`}
                            style={{ backgroundColor: C.inputBg, color: C.text, borderColor: C.border }}
                          />
                        </div>
                      </div>
                      <p className="text-xs font-medium opacity-80" style={{ color: C.text }}>
                        ✨ Os convidados do rolê poderão participar do sorteio e preencher sua lista de desejos.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Invite selector */}
                <EventInviteSelector selectedInvitees={selectedInvitees} onInviteesChange={setSelectedInvitees} />

                {/* Submit */}
                <button
                  type="submit"
                  className={`w-full h-14 rounded-xl ${nb.border} ${nb.shadowLg} ${nb.hover} font-black text-lg flex items-center justify-center gap-2 disabled:opacity-50`}
                  style={{ backgroundColor: C.orange, color: "#FFFDF7" }}
                  disabled={loading || !title || !date || !time || !location}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                      Criando evento...
                    </div>
                  ) : (
                    <>🚀 Criar Evento</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default CreateEvent;
