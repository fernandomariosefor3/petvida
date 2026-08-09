import { useEffect, useRef, useState } from 'react';
import { Pet } from '@/types';
import { buildSosUrl } from '@/lib/sos';
import { generateQrDataUrl } from '@/lib/qrCode';
import { renderCardToPng, downloadCardImage, shareCardImage, canShareFiles } from '@/lib/socialCard';
import PetDigitalCard from './cards/PetDigitalCard';

interface Props {
  pet: Pet;
  onClose: () => void;
  onOpenSos: () => void;
}

export default function PetDigitalCardModal({ pet, onClose, onOpenSos }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isSosActive = Boolean(pet.isSosEnabled && pet.publicSosId);
  const sosUrl = pet.publicSosId ? buildSosUrl(pet.publicSosId) : '';

  useEffect(() => {
    if (!isSosActive || !sosUrl) {
      setQrDataUrl('');
      return;
    }

    let active = true;
    setLoadingQr(true);
    generateQrDataUrl(sosUrl)
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      })
      .finally(() => {
        if (active) setLoadingQr(false);
      });

    return () => {
      active = false;
    };
  }, [isSosActive, sosUrl]);

  const filename = `carteirinha-${pet.name.toLowerCase().replace(/\s+/g, '-')}.png`;
  const shareText = `Carteirinha do ${pet.name} via PetVida Care`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await renderCardToPng(cardRef.current);
      downloadCardImage(dataUrl, filename);
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await renderCardToPng(cardRef.current);
      await shareCardImage(dataUrl, filename, shareText);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">🪪 Carteirinha Digital — {pet.name}</h2>
            <p className="text-sm text-gray-500">Visualize, baixe e compartilhe a carteirinha oficial do seu pet.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <div ref={cardRef} className="shadow-2xl rounded-[32px] overflow-hidden">
              <PetDigitalCard pet={pet} qrDataUrl={qrDataUrl} isSosActive={isSosActive} loadingQr={loadingQr} />
            </div>
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: canShareFiles() ? '1fr 1fr' : '1fr' }}>
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy}
              className="py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-orange-300 transition-all cursor-pointer disabled:opacity-60"
            >
              <i className="ri-download-line mr-1"></i> Baixar carteirinha
            </button>
            {canShareFiles() && (
              <button
                type="button"
                onClick={handleShare}
                disabled={busy}
                className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60"
              >
                <i className="ri-share-line mr-1"></i> Compartilhar
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onOpenSos}
              className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors"
            >
              {isSosActive ? 'Editar dados de emergência' : 'Ativar QR de emergência'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
