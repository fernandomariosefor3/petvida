import { Pet } from '@/types';
import SocialCardFrame, { CardFormat } from './SocialCardFrame';

export default function HealthAchievementCard({ pet, format }: { pet: Pet; format: CardFormat }) {
  return (
    <SocialCardFrame pet={pet} format={format}>
      <div className="absolute inset-x-0 bottom-8 px-5 text-white text-center">
        <p className="text-3xl mb-2">🎉✨</p>
        <h2 className="text-lg font-extrabold leading-tight">
          Vacinas e vermífugos do {pet.name} 100% em dia!
        </h2>
      </div>
    </SocialCardFrame>
  );
}
