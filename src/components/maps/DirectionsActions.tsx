import React from 'react';
import { Navigation, Car, ExternalLink } from 'lucide-react';
import { nb, NBPalette, NBLight } from '@/lib/neobrutalism';

interface DirectionsActionsProps {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  palette?: NBPalette;
}

export const DirectionsActions: React.FC<DirectionsActionsProps> = ({
  address,
  latitude,
  longitude,
  placeId,
  palette = NBLight,
}) => {
  if (!address && !latitude) return null;

  // Google Maps Directions
  const googleMapsUrl = latitude && longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}${placeId ? `&destination_place_id=${placeId}` : ''}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  // Waze Navigation
  const wazeUrl = latitude && longitude
    ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(address)}`;

  // Uber Ride deep-link
  const uberUrl = latitude && longitude
    ? `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${latitude}&dropoff[longitude]=${longitude}&dropoff[formatted_address]=${encodeURIComponent(address)}`
    : `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(address)}`;

  return (
    <div className="w-full space-y-2 mt-3">
      <p className="text-xs font-black uppercase tracking-wider opacity-75" style={{ color: palette.text }}>
        Traçar Rota / Transporte:
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {/* Google Maps */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} text-xs font-black transition-all`}
          style={{ backgroundColor: palette.yellow, color: '#1A1A1A' }}
          title="Abrir rota no Google Maps"
        >
          <Navigation className="w-4 h-4 text-orange-600 fill-orange-600" />
          <span>Google Maps</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>

        {/* Waze */}
        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} text-xs font-black transition-all`}
          style={{ backgroundColor: palette.sky, color: '#1A1A1A' }}
          title="Navegar com Waze"
        >
          <Car className="w-4 h-4 text-blue-700" />
          <span>Waze</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>

        {/* Uber */}
        <a
          href={uberUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${nb.border} ${nb.shadow} ${nb.hover} text-xs font-black transition-all`}
          style={{ backgroundColor: palette.sectionBg, color: palette.text }}
          title="Pedir corrida no Uber até o local"
        >
          <span className="font-black text-sm">UBER</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      </div>
    </div>
  );
};
