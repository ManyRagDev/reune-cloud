import React, { useCallback, useState } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { nb, NBPalette, NBLight } from '@/lib/neobrutalism';

const LIBRARIES: ('places' | 'geometry')[] = ['places'];

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
];

interface EventMapPreviewProps {
  latitude: number | null;
  longitude: number | null;
  title?: string;
  editable?: boolean;
  onPositionChange?: (coords: { latitude: number; longitude: number }) => void;
  height?: string;
  isDark?: boolean;
  palette?: NBPalette;
}

export const EventMapPreview: React.FC<EventMapPreviewProps> = ({
  latitude,
  longitude,
  title,
  editable = false,
  onPositionChange,
  height = "260px",
  isDark = false,
  palette = NBLight,
}) => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.GOOGLE_PLACES_API_KEY || '') as string;
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!latitude || !longitude) {
    return null;
  }

  const center = { lat: latitude, lng: longitude };

  if (!apiKey || loadError) {
    // Fallback: Link estático para o Google Maps sem carregar script
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    return (
      <div
        className={`w-full rounded-2xl ${nb.border} ${nb.shadow} p-4 flex flex-col items-center justify-center text-center gap-2 transition-all`}
        style={{ height, backgroundColor: palette.sectionBg, color: palette.text }}
      >
        <MapPin className="w-8 h-8 text-orange-500 animate-bounce" />
        <p className="text-sm font-bold">Local definido no mapa</p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${nb.border} text-xs font-black bg-white hover:bg-orange-100 text-black transition-colors`}
        >
          <ExternalLink className="w-3.5 h-3.5" /> Ver no Google Maps
        </a>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`w-full rounded-2xl ${nb.border} ${nb.shadow} flex flex-col items-center justify-center gap-2`}
        style={{ height, backgroundColor: palette.sectionBg, color: palette.text }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        <span className="text-xs font-bold opacity-75">Carregando mapa...</span>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full rounded-2xl ${nb.border} ${nb.shadow} overflow-hidden`}
      style={{ height }}
    >
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          styles: isDark ? darkMapStyle : [],
        }}
      >
        <MarkerF
          position={center}
          draggable={editable}
          onDragEnd={(e) => {
            if (editable && onPositionChange && e.latLng) {
              onPositionChange({
                latitude: e.latLng.lat(),
                longitude: e.latLng.lng(),
              });
            }
          }}
          title={title || 'Local do Evento'}
        />
      </GoogleMap>

      {editable && (
        <div
          className={`absolute bottom-3 left-3 px-3 py-1 rounded-lg ${nb.border} text-xs font-black pointer-events-none z-10 shadow-sm`}
          style={{ backgroundColor: palette.yellow, color: '#1A1A1A' }}
        >
          📍 Arraste o pino para ajustar
        </div>
      )}
    </div>
  );
};
