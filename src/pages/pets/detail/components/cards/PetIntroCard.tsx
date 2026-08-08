import { Pet } from '@/types';
import SocialCardFrame, { CardFormat } from './SocialCardFrame';

function getAge(birthDate: string): string {
  if (!birthDate) return '';
  const bd = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth());
  if (months < 12) return `${months} meses`;
  return `${Math.floor(months / 12)} anos`;
}

export default function PetIntroCard({ pet, format }: { pet: Pet; format: CardFormat }) {
  const age = getAge(pet.birthDate);

  return (
    <SocialCardFrame pet={pet} format={format}>
      <div className="absolute inset-x-0 bottom-8 px-5 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mb-1">Conheça o(a)</p>
        <h2 className="text-xl font-extrabold leading-tight mb-2">{pet.name} 🐾</h2>
        <div className="flex flex-wrap gap-1.5 text-[9px] font-medium">
          {pet.breed && <span className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">{pet.breed}</span>}
          {age && <span className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">{age}</span>}
          {pet.bloodType && <span className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">Tipo {pet.bloodType}</span>}
        </div>
      </div>
    </SocialCardFrame>
  );
}
