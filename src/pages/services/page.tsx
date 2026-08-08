import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getCurrentPosition, Coordinates, GeolocationError } from '@/lib/geolocation';
import { fetchNearbyPlaces, NearbyPlace, ServiceCategory } from '@/lib/overpass';

// Leaflet's default marker icon references relative image paths that break under bundlers — re-point them at the bundled assets.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const RADIUS_METERS = 5000;

const CATEGORY_INFO: Record<ServiceCategory, { label: string; icon: string }> = {
  vet: { label: 'Hospital / Clínica', icon: '🚨' },
  petshop: { label: 'Pet Shop', icon: '✂️' },
  park: { label: 'Parques', icon: '🌳' },
};

type Status = 'requesting' | 'ready' | 'denied' | 'error';

function googleMapsRoute(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

function wazeRoute(lat: number, lon: number): string {
  return `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
}

export default function ServicesPage() {
  const [status, setStatus] = useState<Status>('requesting');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Set<ServiceCategory>>(
    new Set(['vet', 'petshop', 'park'])
  );

  useEffect(() => {
    getCurrentPosition()
      .then((pos) => { setCoords(pos); setStatus('ready'); })
      .catch((err: unknown) => {
        setStatus(err instanceof GeolocationError && err.reason === 'denied' ? 'denied' : 'error');
      });
  }, []);

  useEffect(() => {
    if (!coords) return;
    setPlacesLoading(true);
    setPlacesError(false);
    fetchNearbyPlaces(coords.lat, coords.lon, RADIUS_METERS, ['vet', 'petshop', 'park'])
      .then(setPlaces)
      .catch(() => setPlacesError(true))
      .finally(() => setPlacesLoading(false));
  }, [coords]);

  const visiblePlaces = useMemo(
    () => places.filter((p) => activeCategories.has(p.category)),
    [places, activeCategories]
  );

  const toggleCategory = (category: ServiceCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🚨 Serviços & Emergência 24h</h1>
            <p className="text-gray-500 text-sm mt-1">Hospitais veterinários, pet shops e parques perto de você.</p>
          </div>
          <a
            href="https://www.google.com/maps/search/veterin%C3%A1rio+24h"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-orange-300 transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-external-link-line"></i> Abrir busca no Google Maps
          </a>
        </div>

        {status === 'requesting' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <i className="ri-loader-4-line animate-spin text-2xl text-orange-400"></i>
            <p className="text-gray-500 text-sm mt-3">Obtendo sua localização...</p>
          </div>
        )}

        {status === 'denied' && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
            <i className="ri-map-pin-off-line text-amber-500 text-2xl"></i>
            <p className="text-amber-800 font-medium mt-2">Precisamos da sua localização para mostrar lugares perto de você.</p>
            <p className="text-amber-700 text-sm mt-1">Ative a permissão de localização no navegador e recarregue a página, ou use o link do Google Maps acima.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 text-center">
            <i className="ri-error-warning-line text-gray-400 text-2xl"></i>
            <p className="text-gray-700 font-medium mt-2">Não conseguimos obter sua localização agora.</p>
            <p className="text-gray-500 text-sm mt-1">Use o link do Google Maps acima para buscar diretamente.</p>
          </div>
        )}

        {status === 'ready' && coords && (
          <>
            <div className="flex flex-wrap gap-2 mb-5">
              {(Object.keys(CATEGORY_INFO) as ServiceCategory[]).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                    activeCategories.has(category) ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                  }`}
                >
                  {CATEGORY_INFO[category].icon} {CATEGORY_INFO[category].label}
                </button>
              ))}
            </div>

            {placesError && (
              <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 text-center mb-5">
                <i className="ri-error-warning-line text-gray-400 text-2xl"></i>
                <p className="text-gray-700 font-medium mt-2">Não conseguimos buscar locais agora.</p>
                <p className="text-gray-500 text-sm mt-1">Tente novamente em instantes, ou use o link do Google Maps no topo da página.</p>
              </div>
            )}

            {placesLoading && !placesError && (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center mb-5">
                <i className="ri-loader-4-line animate-spin text-2xl text-orange-400"></i>
                <p className="text-gray-500 text-sm mt-3">Buscando lugares perto de você...</p>
              </div>
            )}

            {!placesLoading && !placesError && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-2xl overflow-hidden border border-gray-100" style={{ height: 420 }}>
                  <MapContainer center={[coords.lat, coords.lon]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a> contributors"
                    />
                    <Marker position={[coords.lat, coords.lon]}>
                      <Popup>Você está aqui</Popup>
                    </Marker>
                    {visiblePlaces.map((place) => (
                      <Marker key={place.id} position={[place.lat, place.lon]}>
                        <Popup>
                          <strong>{place.name}</strong>
                          <br />
                          {CATEGORY_INFO[place.category].label}
                          {place.is24h && ' · 24h'}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>

                <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 420 }}>
                  {visiblePlaces.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                      <p className="text-gray-500 text-sm">Nenhum lugar encontrado num raio de 5km. Tente o link do Google Maps no topo da página.</p>
                    </div>
                  )}
                  {visiblePlaces.map((place) => (
                    <div key={place.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 text-sm">{place.name}</h3>
                        {place.is24h && (
                          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">24h</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mb-3">
                        {CATEGORY_INFO[place.category].icon} {CATEGORY_INFO[place.category].label}
                        {place.address && ` · ${place.address}`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {place.phone && (
                          <a href={`tel:${place.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                            <i className="ri-phone-fill"></i> Ligar agora
                          </a>
                        )}
                        <a href={googleMapsRoute(place.lat, place.lon)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                          <i className="ri-map-pin-line"></i> Google Maps
                        </a>
                        <a href={wazeRoute(place.lat, place.lon)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                          <i className="ri-compass-3-line"></i> Waze
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
