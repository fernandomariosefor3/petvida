import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicSosProfile, PublicSosProfile } from '@/lib/sos';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export default function SosPublicPage() {
  const { publicSosId } = useParams<{ publicSosId: string }>();
  const [profile, setProfile] = useState<PublicSosProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!publicSosId) { setError(true); setLoading(false); return; }
    fetchPublicSosProfile(publicSosId)
      .then(setProfile)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [publicSosId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <i className="ri-loader-4-line animate-spin text-3xl text-orange-400"></i>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-qr-scan-2-line text-gray-300 text-2xl"></i>
          </div>
          <h1 className="font-bold text-gray-800 mb-2">Perfil SOS não encontrado</h1>
          <p className="text-gray-500 text-sm">Esse QR code pode estar desatualizado ou o perfil foi desativado pelo tutor.</p>
        </div>
      </div>
    );
  }

  const whatsappHref = profile.sosWhatsapp
    ? `https://wa.me/${digitsOnly(profile.sosWhatsapp)}?text=${encodeURIComponent(`Olá! Encontrei o(a) ${profile.name} 🐾`)}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-500 to-rose-600 px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-red-500 text-white text-center py-3 text-sm font-bold uppercase tracking-wide">
          🆘 Perfil de Emergência
        </div>

        <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
          {profile.photo ? (
            <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <i className="ri-heart-2-line text-gray-300 text-5xl"></i>
          )}
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">{profile.name}</h1>
          <p className="text-gray-500 text-sm mb-5">{profile.breed || profile.species}</p>

          {profile.sosMedicalNotes && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
              <i className="ri-alert-line text-amber-500 mt-0.5"></i>
              <p className="text-amber-800 text-sm leading-relaxed">{profile.sosMedicalNotes}</p>
            </div>
          )}

          <p className="text-gray-400 text-xs uppercase font-semibold mb-2">Contato do tutor</p>
          {profile.sosContactName && <p className="text-gray-700 font-medium mb-3">{profile.sosContactName}</p>}

          <div className="space-y-3">
            {profile.sosPhone && (
              <a
                href={`tel:${profile.sosPhone}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors cursor-pointer"
              >
                <i className="ri-phone-fill"></i> Ligar para o tutor
              </a>
            )}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors cursor-pointer"
              >
                <i className="ri-whatsapp-fill"></i> Abrir WhatsApp
              </a>
            )}
          </div>

          <p className="text-center text-gray-300 text-xs mt-6">Perfil gerado por PetVida Care</p>
        </div>
      </div>
    </div>
  );
}
