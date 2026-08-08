import { useRef, useState } from 'react';
import { Pet } from '@/types';
import { renderCardToPng, downloadCardImage, shareCardImage, canShareFiles } from '@/lib/socialCard';
import SocialCardFrame, { CardFormat } from './cards/SocialCardFrame';
import PetIntroCard from './cards/PetIntroCard';
import HealthAchievementCard from './cards/HealthAchievementCard';
import BirthdayCard from './cards/BirthdayCard';

type CardType = 'intro' | 'health' | 'birthday';

interface Props {
  pet: Pet;
  overdueCount: number;
  onClose: () => void;
}

const CARD_OPTIONS: { key: CardType; label: string }[] = [
  { key: 'intro', label: 'Ficha do pet' },
  { key: 'health', label: 'Saúde em dia' },
  { key: 'birthday', label: 'Aniversário' },
];

export default function SocialCardModal({ pet, overdueCount, onClose }: Props) {
  const [cardType, setCardType] = useState<CardType>('intro');
  const [format, setFormat] = useState<CardFormat>('story');
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const filename = `card-${cardType}-${pet.name.toLowerCase().replace(/\s+/g, '-')}.png`;
  const shareText = `Conheça o(a) ${pet.name}! 🐾 via PetVida Care`;

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
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">📸 Compartilhar — {pet.name}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="p-6">
          {/* Card type selector */}
          <div className="flex gap-2 mb-4">
            {CARD_OPTIONS.map((opt) => {
              const disabled = opt.key === 'health' && overdueCount > 0;
              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={disabled}
                  title={disabled ? 'Complete os lembretes atrasados primeiro' : undefined}
                  onClick={() => setCardType(opt.key)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    cardType === opt.key ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-600 hover:border-orange-300'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Format toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5 gap-1 w-fit mx-auto">
            {(['story', 'feed'] as CardFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  format === f ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                }`}
              >
                {f === 'story' ? 'Stories' : 'Feed'}
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="flex justify-center mb-6">
            <div ref={cardRef} className="shadow-xl">
              {cardType === 'intro' && <PetIntroCard pet={pet} format={format} />}
              {cardType === 'health' && <HealthAchievementCard pet={pet} format={format} />}
              {cardType === 'birthday' && <BirthdayCard pet={pet} format={format} />}
            </div>
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: canShareFiles() ? '1fr 1fr' : '1fr' }}>
            <button
              type="button"
              disabled={busy}
              onClick={handleDownload}
              className="py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-orange-300 transition-all cursor-pointer disabled:opacity-60"
            >
              <i className="ri-download-line mr-1"></i> Baixar imagem
            </button>
            {canShareFiles() && (
              <button
                type="button"
                disabled={busy}
                onClick={handleShare}
                className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60"
              >
                <i className="ri-share-line mr-1"></i> Compartilhar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
