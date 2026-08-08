import { ReactNode } from 'react';
import { Pet } from '@/types';

export type CardFormat = 'story' | 'feed';

interface Props {
  pet: Pet;
  format: CardFormat;
  children: ReactNode;
}

const CARD_WIDTH = 270;

/**
 * Shared frame for every shareable card: fixed aspect ratio (9:16 for
 * Stories, 1:1 for Feed), pet photo background, darkening gradient for text
 * legibility, and the watermark the v4 spec requires on every card. Rendered
 * at design size and exported at pixelRatio 4 (see src/lib/socialCard.ts),
 * so this stays small and cheap to lay out on screen.
 */
export default function SocialCardFrame({ pet, format, children }: Props) {
  const height = format === 'story' ? CARD_WIDTH * (16 / 9) : CARD_WIDTH;

  return (
    <div
      className="relative overflow-hidden bg-emerald-900"
      style={{ width: CARD_WIDTH, height }}
    >
      {pet.photo ? (
        <img
          src={pet.photo}
          alt=""
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-800">
          <i className="ri-heart-2-line text-emerald-500 text-5xl"></i>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

      {children}

      <p className="absolute bottom-2 inset-x-0 text-center text-white/70 text-[8px] font-medium tracking-wide">
        PetVida Care • petvida.net.br
      </p>
    </div>
  );
}
