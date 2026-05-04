import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

const typeColors: Record<string, string> = {
  vaccine: 'bg-emerald-100 text-emerald-700',
  appointment: 'bg-amber-100 text-amber-700',
  medication: 'bg-rose-100 text-rose-700',
  grooming: 'bg-violet-100 text-violet-700',
  other: 'bg-gray-100 text-gray-700',
};

const typeLabels: Record<string, string> = {
  vaccine: 'Vacina',
  appointment: 'Consulta',
  medication: 'Medicamento',
  grooming: 'Banho/Tosa',
  other: 'Outro',
};

const typeIcons: Record<string, string> = {
  vaccine: 'ri-syringe-line',
  appointment: 'ri-stethoscope-line',
  medication: 'ri-capsule-line',
  grooming: 'ri-scissors-line',
  other: 'ri-calendar-line',
};

const healthTypeLabels: Record<string, string> = {
  appointment: 'Consulta',
  vaccine: 'Vacina',
  weight: 'Pesagem',
  exam: 'Exame',
  surgery: 'Cirurgia',
  other: 'Outro',
};

// Paw SVG decoration
const PawBg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <ellipse cx="6" cy="7" rx="2" ry="2.5"/>
    <ellipse cx="11" cy="5" rx="2" ry="2.5"/>
    <ellipse cx="16" cy="7" rx="2" ry="2.5"/>
    <ellipse cx="18.5" cy="12" rx="1.5" ry="2"/>
    <path d="M12 10c-3.5 0-7 2.5-7 6 0 2.5 2 4 4 4h6c2 0 4-1.5 4-4 0-3.5-3.5-6-7-6z"/>
  </svg>
);

const statConfig = [
  {
    key: 'pets',
    icon: 'ri-heart-2-line',
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-100',
    text: 'text-emerald-700',
    sub: 'cadastrados',
    emoji: '🐾',
  },
  {
    key: 'upcoming',
    icon: 'ri-alarm-line',
    gradient: 'from-amber-400 to-orange-500',
    bg: 'from-amber-50 to-orange-50',
    border: 'border-amber-100',
    text: 'text-amber-700',
    sub: 'próximos',
    emoji: '⏰',
  },
  {
    key: 'overdue',
    icon: 'ri-error-warning-line',
    gradient: 'from-rose-400 to-pink-500',
    bg: 'from-rose-50 to-pink-50',
    border: 'border-rose-100',
    text: 'text-rose-700',
    sub: 'atrasados',
    emoji: '⚠️',
  },
  {
    key: 'completed',
    icon: 'ri-checkbox-circle-line',
    gradient: 'from-violet-400 to-indigo-500',
    bg: 'from-violet-50 to-indigo-50',
    border: 'border-violet-100',
    text: 'text-violet-700',
    sub: 'concluídos',
    emoji: '✅',
  },
];

export default function DashboardPage() {
  const { currentUser, pets, reminders, healthRecords, getPetById, isPremium, planLimits } = useApp();

  if (!currentUser) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = reminders
    .filter(r => !r.completed && new Date(r.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const overdue = reminders.filter(r => !r.completed && new Date(r.date) < today);
  const completed = reminders.filter(r => r.completed);

  const recentHealth = [...healthRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getDaysUntil = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    const diff = Math.ceil((dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Amanhã';
    if (diff < 0) return `${Math.abs(diff)}d atrás`;
    return `Em ${diff} dias`;
  };

  const getAge = (birthDate: string) => {
    const bd = new Date(birthDate);
    const months = (today.getFullYear() - bd.getFullYear()) * 12 + (today.getMonth() - bd.getMonth());
    if (months < 12) return `${months}m`;
    return `${Math.floor(months / 12)}a`;
  };

  const statValues: Record<string, number> = {
    pets: pets.length,
    upcoming: upcoming.length,
    overdue: overdue.length,
    completed: completed.length,
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #f0fdf4 50%, #eff6ff 100%)' }}>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header with paw decorations */}
        <div className="mb-8 relative overflow-hidden rounded-2xl px-6 py-6"
          style={{ background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 50%, #34d399 100%)' }}>
          {/* Decorative paws */}
          <div className="absolute top-2 right-4 w-16 h-16 text-white/10 pointer-events-none"><PawBg /></div>
          <div className="absolute bottom-1 right-20 w-10 h-10 text-white/10 pointer-events-none rotate-12"><PawBg /></div>
          <div className="absolute top-4 right-36 w-8 h-8 text-white/10 pointer-events-none -rotate-12"><PawBg /></div>
          <div className="absolute -bottom-2 right-10 w-12 h-12 text-white/10 pointer-events-none rotate-45"><PawBg /></div>
          <h1 className="text-2xl font-bold text-white">Olá, {currentUser.name.split(' ')[0]}! 👋</h1>
          <p className="text-white/80 text-sm mt-1">
            {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-white/70 text-xs mt-2">🐾 Tudo sob controle para seus pets hoje?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statConfig.map(cfg => (
            <div key={cfg.key} className={`bg-gradient-to-br ${cfg.bg} rounded-2xl p-5 border ${cfg.border} relative overflow-hidden`}>
              <div className="absolute top-2 right-2 w-10 h-10 opacity-10 pointer-events-none">
                <PawBg />
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${cfg.gradient} shadow-sm`}>
                <i className={`${cfg.icon} text-lg text-white`}></i>
              </div>
              <p className={`text-3xl font-bold ${cfg.text}`}>{statValues[cfg.key]}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cfg.sub} {cfg.emoji}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Upgrade banner for free users */}
          {!isPremium && (
            <div className="lg:col-span-3 rounded-2xl p-5 flex items-center justify-between shadow-sm"
              style={{ background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="ri-vip-crown-line text-white text-2xl"></i>
                </div>
                <div>
                  <p className="text-white font-bold">Desbloqueie todo o potencial do PetVida!</p>
                  <p className="text-orange-100 text-sm">Pets ilimitados, upload de fotos e muito mais por R$29,99/ano</p>
                </div>
              </div>
              <Link to="/planos" className="px-5 py-2.5 bg-white text-orange-600 font-bold text-sm rounded-xl hover:bg-orange-50 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0">
                Conhecer Premium
              </Link>
            </div>
          )}

          {/* Meus Pets */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-lg">🐾</span> Meus Pets
              </h2>
              <Link to="/pets" className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap">
                Ver todos <i className="ri-arrow-right-line text-xs"></i>
              </Link>
            </div>
            <div className="space-y-3">
              {pets.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-orange-100 text-center relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <PawBg />
                  </div>
                  <div className="text-5xl mb-3">🐶</div>
                  <p className="text-sm text-gray-500 mb-3 font-medium">Nenhum pet cadastrado ainda</p>
                  <Link to="/pets" className="inline-flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-full cursor-pointer whitespace-nowrap">
                    <i className="ri-add-line"></i> Adicionar pet
                  </Link>
                </div>
              ) : (
                pets.map(pet => (
                  <Link key={pet.id} to={`/pets/${pet.id}`} className="bg-white rounded-2xl p-4 border border-orange-100 flex items-center gap-3 hover:border-orange-300 hover:bg-orange-50/40 transition-all cursor-pointer shadow-sm">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                      {pet.photo
                        ? <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover object-top" />
                        : <span className="text-2xl">{pet.species === 'Gato' ? '🐱' : '🐶'}</span>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{pet.name}</p>
                      <p className="text-xs text-gray-400 truncate">{pet.breed} • {getAge(pet.birthDate)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-600">{pet.weight} kg</p>
                      <p className="text-xs text-gray-400">{pet.species}</p>
                    </div>
                  </Link>
                ))
              )}
              {pets.length > 0 && (
                <Link to="/pets" className="flex items-center justify-center gap-2 bg-white rounded-2xl p-3 border border-dashed border-orange-200 text-sm text-orange-400 hover:border-orange-400 hover:text-orange-600 transition-all cursor-pointer">
                  <i className="ri-add-line"></i> Novo pet
                </Link>
              )}
            </div>
          </div>

          {/* Próximos Lembretes */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-lg">⏰</span> Próximos Lembretes
              </h2>
              <Link to="/reminders" className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap">
                Ver todos <i className="ri-arrow-right-line text-xs"></i>
              </Link>
            </div>
            <div className="space-y-3">
              {overdue.length > 0 && (
                <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <i className="ri-error-warning-line text-rose-500"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rose-700">{overdue.length} lembrete{overdue.length > 1 ? 's' : ''} atrasado{overdue.length > 1 ? 's' : ''}</p>
                    <p className="text-xs text-rose-500">Acesse lembretes para verificar</p>
                  </div>
                  <Link to="/reminders" className="ml-auto whitespace-nowrap text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer">Ver <i className="ri-arrow-right-line text-xs"></i></Link>
                </div>
              )}
              {upcoming.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-amber-100 text-center relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <PawBg />
                  </div>
                  <div className="text-5xl mb-3">📅</div>
                  <p className="text-sm text-gray-500 mb-3 font-medium">Nenhum lembrete próximo</p>
                  <Link to="/reminders" className="inline-flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-full cursor-pointer whitespace-nowrap">
                    <i className="ri-add-line"></i> Novo lembrete
                  </Link>
                </div>
              ) : (
                upcoming.map(r => {
                  const pet = getPetById(r.petId);
                  const daysUntil = getDaysUntil(r.date);
                  return (
                    <div key={r.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[r.type]}`}>
                        <i className={`${typeIcons[r.type]} text-sm`}></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm truncate">{r.title}</p>
                        <p className="text-xs text-gray-400">{pet?.name || '—'} • {typeLabels[r.type]}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-semibold ${daysUntil === 'Hoje' ? 'text-rose-600' : daysUntil === 'Amanhã' ? 'text-amber-600' : 'text-gray-500'}`}>{daysUntil}</p>
                        <p className="text-xs text-gray-400">{formatDate(r.date)} {r.time}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Health Records */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="text-lg">🏥</span> Histórico Recente de Saúde
            </h2>
            <Link to="/health" className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap">
              Ver tudo <i className="ri-arrow-right-line text-xs"></i>
            </Link>
          </div>
          {recentHealth.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-emerald-100 text-center relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5 pointer-events-none"><PawBg /></div>
              <div className="text-5xl mb-3">🩺</div>
              <p className="text-sm text-gray-500 font-medium">Nenhum registro de saúde ainda</p>
              <p className="text-xs text-gray-400 mt-1">Adicione consultas, vacinas e pesagens dos seus pets</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentHealth.map(h => {
                const pet = getPetById(h.petId);
                return (
                  <div key={h.id} className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">{healthTypeLabels[h.type]}</span>
                      <span className="text-xs text-gray-400">{formatDate(h.date)}</span>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm mb-1">{pet?.name || '—'}</p>
                    {h.weight && <p className="text-xs text-gray-500 mb-1">{h.weight} kg</p>}
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{h.notes || '—'}</p>
                    {h.vet && <p className="text-xs text-gray-400 mt-2 truncate"><i className="ri-user-heart-line mr-1"></i>{h.vet}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
