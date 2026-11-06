import React, { useState, useRef } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { nb, NBPalette, NBLight } from '@/lib/neobrutalism';

const LIBRARIES: ('places' | 'geometry')[] = ['places'];

export interface SelectedPlace {
  address: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  name?: string;
}

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: SelectedPlace) => void;
  placeholder?: string;
  disabled?: boolean;
  palette?: NBPalette;
  required?: boolean;
}

export const GoogleAddressAutocomplete: React.FC<GoogleAddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Digite o endereço ou nome do local...",
  disabled = false,
  palette = NBLight,
  required = false,
}) => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.GOOGLE_PLACES_API_KEY || '') as string;
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const handlePlaceChanged = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();

    if (!place || !place.geometry || !place.geometry.location) {
      // O usuário digitou texto e deu enter sem selecionar uma sugestão específica
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address || place.name || value;
    const placeId = place.place_id || null;

    onChange(address);
    onPlaceSelect({
      address,
      latitude: lat,
      longitude: lng,
      placeId,
      name: place.name,
    });
  };

  // Se a chave não estiver configurada ou houver erro de carregamento, renderiza input padrão com fallback suave
  if (!apiKey || loadError || !isLoaded) {
    return (
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`h-12 rounded-xl ${nb.input} text-base font-bold pr-10`}
          style={{
            backgroundColor: palette.inputBg,
            color: palette.text,
            borderColor: palette.border,
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {!isLoaded && apiKey ? (
            <Loader2 className="w-5 h-5 animate-spin opacity-50" />
          ) : (
            <MapPin className="w-5 h-5 opacity-50" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <Autocomplete
        onLoad={(auto) => {
          autocompleteRef.current = auto;
        }}
        onPlaceChanged={handlePlaceChanged}
        options={{
          componentRestrictions: { country: 'br' },
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
        }}
      >
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`h-12 rounded-xl ${nb.input} text-base font-bold pr-10`}
          style={{
            backgroundColor: palette.inputBg,
            color: palette.text,
            borderColor: palette.border,
          }}
        />
      </Autocomplete>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
        <MapPin className="w-5 h-5 opacity-70" />
      </div>
    </div>
  );
};
