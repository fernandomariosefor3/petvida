import { Pet } from '@/types';

interface Props {
  pet: Pet;
  qrDataUrl: string;
  isSosActive: boolean;
  loadingQr: boolean;
}

const formatBirthDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatAge = (value: string) => {
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth() + years * 12;
  if (months < 1) return 'Menos de 1 mês';
  if (months < 12) return `${months} mês${months > 1 ? 'es' : ''}`;
  const roundedYears = Math.floor(months / 12);
  return `${roundedYears} ano${roundedYears > 1 ? 's' : ''}`;
};

const normalizeName = (value: string) => value.trim();

export default function PetDigitalCard({ pet, qrDataUrl, isSosActive, loadingQr }: Props) {
  const items = [
    { label: 'Raça', value: pet.breed },
    { label: 'Sexo', value: pet.gender === 'male' ? 'Macho' : 'Fêmea' },
    { label: 'Peso', value: pet.weight ? `${pet.weight.toFixed(1)} kg` : '' },
    { label: 'Pelagem', value: pet.color },
    { label: 'Microchip', value: pet.microchip },
    { label: 'Tipo sanguíneo', value: pet.bloodType },
    { label: 'Castrado', value: pet.neutered ? 'Sim' : 'Não' },
    { label: 'Alergias', value: pet.allergies },
  ].filter((item) => item.value && item.value !== '');

  const birthDate = pet.birthDate ? formatBirthDate(pet.birthDate) : '';
  const age = pet.birthDate ? formatAge(pet.birthDate) : '';

  return (
    <div className="bg-white rounded-[40px] overflow-hidden border border-gray-100 min-w-[320px] max-w-[400px]">
      <div className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-orange-400 p-5">
        <div className="text-white text-[11px] font-semibold uppercase tracking-[0.2em]">PetVida Care</div>
        <div className="mt-3 text-white text-xl font-bold leading-tight">Carteirinha Digital</div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-[96px_1fr] gap-4 items-center">
          <div className="w-24 h-24 rounded-3xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
            {pet.photo ? (
              <img
                src={pet.photo}
                alt={pet.name}
                className="object-cover w-full h-full"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="text-gray-400 text-3xl">
                <i className="ri-paw-line"></i>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-xl font-bold text-gray-900">{normalizeName(pet.name)}</div>
            <div className="text-sm text-gray-500">
              {pet.species}{pet.breed ? ` • ${pet.breed}` : ''}
            </div>
            <div className="text-sm text-gray-500">
              {birthDate && <span>{birthDate}</span>}
              {birthDate && age ? ' • ' : ''}
              {age}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="rounded-3xl bg-gray-50 border border-gray-100 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">{item.label}</div>
              <div className="mt-2 text-sm font-semibold text-gray-900">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-gray-50 p-4">
          {isSosActive ? (
            <div className="space-y-3 text-center">
              <div className="mx-auto w-40 h-40 rounded-3xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                {loadingQr ? (
                  <i className="ri-loader-4-line animate-spin text-3xl text-gray-400"></i>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR de emergência" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 text-sm">QR indisponível</div>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Escaneie em caso de emergência</div>
                <p className="text-xs text-gray-500">O código leva ao perfil SOS público do pet.</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">QR de emergência ainda não ativado</div>
              <p className="text-xs text-gray-500 mt-2">Ative o SOS para gerar o QR público.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
