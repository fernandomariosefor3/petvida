import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useGuest } from '@/contexts/guest/GuestContext';
import GuestClaimModal from '@/components/feature/GuestClaimModal';

const speciesOptions = ['Cão', 'Gato', 'Pássaro', 'Coelho', 'Hamster', 'Peixe', 'Réptil', 'Outro'];

export default function GuestPetPage() {
  const { firebaseUser } = useApp();
  const { guestPet, createGuestPet } = useGuest();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState(speciesOptions[0]);
  const [breed, setBreed] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firebaseUser) navigate('/dashboard');
  }, [firebaseUser, navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createGuestPet({ name, species, breed, photoFile: photoFile ?? undefined });
    } finally {
      setSaving(false);
    }
  };

  if (firebaseUser) return null;

  if (guestPet) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #f0fdf4 50%, #eff6ff 100%)' }}>
        {showClaimModal && <GuestClaimModal petName={guestPet.name} onClose={() => setShowClaimModal(false)} />}
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-orange-100 text-center">
            <div className="w-28 h-28 rounded-full mx-auto mb-5 overflow-hidden bg-orange-50 flex items-center justify-center border-4 border-orange-100">
              {guestPet.photoDataUrl ? (
                <img src={guestPet.photoDataUrl} alt={guestPet.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">🐾</span>
              )}
            </div>
            <span className="inline-block bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              Carteirinha de teste
            </span>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{guestPet.name}</h1>
            <p className="text-gray-500 text-sm mb-6">{guestPet.species}{guestPet.breed ? ` · ${guestPet.breed}` : ''}</p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowClaimModal(true)}
                className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="ri-alarm-line"></i> Adicionar lembrete com notificação
              </button>
              <button
                type="button"
                onClick={() => setShowClaimModal(true)}
                className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold transition-all cursor-pointer hover:border-orange-300"
              >
                Baixar carteirinha
              </button>
            </div>

            <p className="text-gray-400 text-xs mt-6">
              Essa carteirinha está salva só neste navegador.{' '}
              <button type="button" onClick={() => setShowClaimModal(true)} className="text-orange-600 hover:underline cursor-pointer">
                Crie sua conta
              </button>{' '}
              para não perder o {guestPet.name.split(' ')[0]}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #f0fdf4 50%, #eff6ff 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-orange-100">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800">🐶 Crie a carteirinha do seu pet</h1>
            <p className="text-gray-500 text-sm mt-1">Sem cadastro. Leva menos de 1 minuto.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-orange-400 transition-colors"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Prévia" className="w-full h-full object-cover" />
                ) : (
                  <i className="ri-camera-line text-orange-400 text-2xl"></i>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do pet</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="Ex: Bolt"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Espécie</label>
              <select
                value={species} onChange={(e) => setSpecies(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
              >
                {speciesOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Raça (opcional)</label>
              <input
                type="text" value={breed} onChange={(e) => setBreed(e.target.value)}
                placeholder="Ex: Vira-lata"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
              />
            </div>

            <button
              type="submit" disabled={saving}
              className="w-full py-3.5 font-bold rounded-2xl transition-all text-sm cursor-pointer text-white shadow-sm hover:shadow-md disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
            >
              {saving ? 'Criando...' : '🐾 Criar carteirinha grátis'}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <i className="ri-arrow-left-line mr-1 text-xs"></i> Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
