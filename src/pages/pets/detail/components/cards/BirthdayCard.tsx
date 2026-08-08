import { Pet } from '@/types';
import SocialCardFrame, { CardFormat } from './SocialCardFrame';

export default function BirthdayCard({ pet, format }: { pet: Pet; format: CardFormat }) {
  return (
    <SocialCardFrame pet={pet} format={format}>
      <div className="absolute inset-x-0 bottom-8 px-5 text-white text-center">
        <p className="text-3xl mb-2">🎂</p>
        <h2 className="text-lg font-extrabold leading-tight">
          Hoje é aniversário do(a) {pet.name}!
        </h2>
      </div>
    </SocialCardFrame>
  );
}
