import { useState, useEffect } from 'react';
import { Pet } from '@/types';
import { buildSosUrl } from '@/lib/sos';
import { generateQrDataUrl, downloadQrPng, downloadQrPdf } from '@/lib/qrCode';

interface SosFormData {
  sosContactName: string;
  sosPhone: string;
  sosWhatsapp: string;
  sosMedicalNotes: string;
}

interface Props {
  pet: Pet;
  defaultContactName: string;
  defaultPhone: string;
  onClose: () => void;
  onSave: (data: Partial<Pet>) => Promise<void>;
}

export default function SosQrCodeModal({ pet, defaultContactName, defaultPhone, onClose, onSave }: Props) {
  const isActive = Boolean(pet.isSosEnabled && pet.publicSosId);
  const [mode, setMode] = useState<'form' | 'qr'>(isActive ? 'qr' : 'form');
  const [form, setForm] = useState<SosFormData>({
    sosContactName: pet.sosContactName || defaultContactName,
    sosPhone: pet.sosPhone || defaultPhone,
    sosWhatsapp: pet.sosWhatsapp || defaultPhone,
    sosMedicalNotes: pet.sosMedicalNotes || '',
  });
  const [active, setActive] = useState(isActive);
  const [saving, setSaving] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const sosUrl = pet.publicSosId ? buildSosUrl(pet.publicSosId) : '';

  useEffect(() => {
    if (mode !== 'qr' || !sosUrl) return;
    generateQrDataUrl(sosUrl).then(setQrDataUrl).catch(() => setQrDataUrl(''));
  }, [mode, sosUrl]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const publicSosId = pet.publicSosId || crypto.randomUUID();
      await onSave({ ...form, isSosEnabled: active, publicSosId });
      if (active) setMode('qr');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">🆘 Perfil SOS — {pet.name}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
            <i className="ri-close-line"></i>
          </button>
        </div>

        {mode === 'qr' ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 text-sm mb-4">
              Escaneie ou imprima este QR code na coleira. Quem encontrar o {pet.name} acessa o contato sem precisar de login.
            </p>
            <div className="w-48 h-48 mx-auto mb-4 flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
              {qrDataUrl ? <img src={qrDataUrl} alt="QR code do perfil SOS" className="w-40 h-40" /> : <i className="ri-loader-4-line animate-spin text-2xl text-gray-300"></i>}
            </div>
            <p className="text-gray-400 text-xs mb-6 break-all">{sosUrl}</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                disabled={!qrDataUrl}
                onClick={() => downloadQrPng(qrDataUrl, pet.name)}
                className="py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-orange-300 transition-all cursor-pointer disabled:opacity-50"
              >
                <i className="ri-image-line mr-1"></i> Baixar PNG
              </button>
              <button
                type="button"
                disabled={!qrDataUrl}
                onClick={() => downloadQrPdf(qrDataUrl, pet.name)}
                className="py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-orange-300 transition-all cursor-pointer disabled:opacity-50"
              >
                <i className="ri-file-pdf-line mr-1"></i> Baixar PDF
              </button>
            </div>
            <button type="button" onClick={() => setMode('form')} className="text-sm text-orange-600 hover:underline cursor-pointer">
              Editar informações de contato
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome de contato</label>
              <input
                type="text" required value={form.sosContactName}
                onChange={(e) => setForm({ ...form, sosContactName: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone (para ligação)</label>
              <input
                type="tel" required value={form.sosPhone} placeholder="+55 85 99999-9999"
                onChange={(e) => setForm({ ...form, sosPhone: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
              <input
                type="tel" value={form.sosWhatsapp} placeholder="+55 85 99999-9999"
                onChange={(e) => setForm({ ...form, sosWhatsapp: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações médicas (exibidas publicamente)</label>
              <textarea
                rows={3} maxLength={300} value={form.sosMedicalNotes} placeholder="Ex: Alérgico a frango, toma remédio para coração..."
                onChange={(e) => setForm({ ...form, sosMedicalNotes: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
              <span className="text-sm text-gray-700">Perfil SOS ativo (visível publicamente via QR code)</span>
            </label>
            <button
              type="submit" disabled={saving}
              className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Salvando...' : isActive ? 'Salvar alterações' : 'Ativar perfil SOS'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
