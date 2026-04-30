import { Pet } from '@/types';

interface Props {
  pet: Pet;
  healthCount: number;
  pendingCount: number;
  overdueCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PetHeroCard({ pet, healthCount, pendingCount, overdueCount, onEdit, onDelete }: Props) {
  const getAge = (birthDate: string) => {
    if (!birthDate) return '—';
    const bd = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth());
    if (months < 1) return 'Menos de 1 mês';
    if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (rem === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    return `${years}a ${rem}m`;
  };

  const attrs = [
    { label: 'Idade', value: getAge(pet.birthDate), icon: 'ri-calendar-line' },
    { label: 'Peso', value: pet.weight ? `${pet.weight} kg` : '—', icon: 'ri-scales-line' },
    { label: 'Espécie', value: pet.species, icon: 'ri-heart-2-line' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Photo */}
        <div className="w-full md:w-56 h-52 md:h-auto flex-shrink-0 relative">
          {pet.photo ? (
            <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
              <i className="ri-heart-2-line text-emerald-200 text-5xl"></i>
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex gap-2">
            <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {pet.gender === 'male' ? '♂ Macho' : '♀ Fêmea'}
            </span>
            {pet.neutered && (
              <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                Castrado
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{pet.name}</h2>
                <p className="text-gray-500 text-sm mt-0.5">{pet.breed || pet.species}</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button onClick={onEdit} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-500 hover:text-orange-600 transition-all cursor-pointer">
                  <i className="ri-edit-line text-sm"></i>
                </button>
                <button onClick={onDelete} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:border-rose-200 hover:bg-rose-50 text-gray-500 hover:text-rose-500 transition-all cursor-pointer">
                  <i className="ri-delete-bin-line text-sm"></i>
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">{pet.species}</span>
              {pet.color && <span className="bg-gray-50 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">{pet.color}</span>}
              {pet.microchip && <span className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full"><i className="ri-cpu-line mr-1"></i>Microchip</span>}
            </div>

            {/* Attribute grid */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {attrs.map(attr => (
                <div key={attr.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="w-6 h-6 flex items-center justify-center mx-auto mb-1">
                    <i className={`${attr.icon} text-sm text-gray-400`}></i>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 truncate">{attr.value}</p>
                  <p className="text-xs text-gray-400">{attr.label}</p>
                </div>
              ))}
            </div>

            {/* Allergies warning */}
            {pet.allergies && (
              <div className="flex items-center gap-2 mt-3 bg-amber-50 rounded-xl px-3 py-2">
                <i className="ri-alert-line text-amber-500 text-sm"></i>
                <p className="text-xs text-amber-700"><strong>Alergias:</strong> {pet.allergies}</p>
              </div>
            )}

            {/* Extra info row */}
            {(pet.bloodType || pet.microchip) && (
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                {pet.bloodType && <span><i className="ri-drop-line mr-1 text-rose-400"></i>Tipo: {pet.bloodType}</span>}
                {pet.microchip && <span><i className="ri-cpu-line mr-1 text-blue-400"></i>{pet.microchip}</span>}
              </div>
            )}

            {pet.notes && <p className="text-sm text-gray-500 mt-4 leading-relaxed">{pet.notes}</p>}
          </div>

          {/* Bottom stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xl font-bold text-gray-800">{healthCount}</p>
              <p className="text-xs text-gray-400">Registros de saúde</p>
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-xs text-gray-400">Lembretes pendentes</p>
            </div>
            {overdueCount > 0 && (
              <div>
                <p className="text-xl font-bold text-rose-600">{overdueCount}</p>
                <p className="text-xs text-gray-400">Atrasados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
