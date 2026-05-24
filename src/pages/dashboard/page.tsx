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

const statConfig = [
  {
    key: 'pets',
    icon: 'ri-heart-2-line',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    sub: 'Pets cadastrados',
  },
  {
    key: 'upcoming',
    icon: 'ri-alarm-line',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    sub: 'Próximos lembretes',
  },
  {
    key: 'overdue',
    icon: 'ri-error-warning-line',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    sub: 'Lembretes atrasados',
  },
  {
    key: 'completed',
    icon: 'ri-checkbox-circle-line',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    sub: 'Concluídos',
  },
];

export default function DashboardPage() {
  const { currentUser, pets, reminders, healthRecords, getPetById, isPremium } = useApp();

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
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">
            Olá, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statConfig.map(cfg => (
            <div key={cfg.key} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${cfg.bg}`}>
                <i className={`${cfg.icon} text-base ${cfg.color}`}></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statValues[cfg.key]}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cfg.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Upgrade banner for free users */}
          {!isPremium && (
            <div className="lg:col-span-3 bg-orange-500 rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-vip-crown-line text-white text-xl"></i>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Desbloqueie todo o potencial do PetVida</p>
                  <p className="text-orange-100 text-xs mt-0.5">Pets ilimitados, upload de fotos e mais por R$29,99/ano</p>
                </div>
              </div>
              <Link to="/planos" className="px-4 py-2 bg-white text-orange-600 font-semibold text-xs rounded-lg hover:bg-orange-50 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0">
                Ver planos
              </Link>
            </div>
          )}

          {/* Meus Pets */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 text-sm">Meus Pets</h2>
              <Link to="/pets" className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap">
                Ver todos
              </Link>
            </div>
            <div className="space-y-2">
              {pets.length === 0 ? (
                <div className="bg-white rounded-xl p-6 border border-gray-100 text-center shadow-sm">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="ri-heart-2-line text-gray-300 text-xl"></i>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Nenhum pet cadastrado</p>
                  <Link to="/pets" className="inline-flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap">
                    <i className="ri-add-line"></i> Adicionar pet
                  </Link>
                </div>
              ) : (
                pets.map(pet => (
                  <Link key={pet.id} to={`/pets/${pet.id}`} className="bg-white rounded-xl p-3.5 border border-gray-100 flex items-center gap-3 hover:border-orange-200 transition-all cursor-pointer shadow-sm">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      {pet.photo
                        ? <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover object-top" />
                        : <i className="ri-heart-2-line text-gray-300 text-base"></i>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{pet.name}</p>
                      <p className="text-xs text-gray-400 truncate">{pet.breed || pet.species} · {getAge(pet.birthDate)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-600">{pet.weight} kg</p>
                    </div>
                  </Link>
                ))
              )}
              {pets.length > 0 && (
                <Link to="/pets" className="flex items-center justify-center gap-2 bg-white rounded-xl p-3 border border-dashed border-gray-200 text-sm text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-all cursor-pointer">
                  <i className="ri-add-line text-sm"></i> Novo pet
                </Link>
              )}
            </div>
          </div>

          {/* Próximos Lembretes */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 text-sm">Próximos Lembretes</h2>
              <Link to="/reminders" className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap">
                Ver todos
              </Link>
            </div>
            <div className="space-y-2">
              {overdue.length > 0 && (
                <div className="bg-rose-50 rounded-xl p-3.5 border border-rose-100 flex items-center gap-3">
                  <i className="ri-error-warning-line text-rose-500 text-sm flex-shrink-0"></i>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-rose-700">{overdue.length} lembrete{overdue.length > 1 ? 's' : ''} atrasado{overdue.length > 1 ? 's' : ''}</p>
                  </div>
                  <Link to="/reminders" className="whitespace-nowrap text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer flex-shrink-0">Ver</Link>
                </div>
              )}
              {upcoming.length === 0 ? (
                <div className="bg-white rounded-xl p-6 border border-gray-100 text-center shadow-sm">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="ri-alarm-line text-gray-300 text-xl"></i>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Nenhum lembrete próximo</p>
                  <Link to="/reminders" className="inline-flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap">
                    <i className="ri-add-line"></i> Novo lembrete
                  </Link>
                </div>
              ) : (
                upcoming.map(r => {
                  const pet = getPetById(r.petId);
                  const daysUntil = getDaysUntil(r.date);
                  return (
                    <div key={r.id} className="bg-white rounded-xl p-3.5 border border-gray-100 flex items-center gap-3 shadow-sm">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[r.type]}`}>
                        <i className={`${typeIcons[r.type]} text-sm`}></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm truncate">{r.title}</p>
                        <p className="text-xs text-gray-400">{pet?.name || '—'} · {typeLabels[r.type]}</p>
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
            <h2 className="font-semibold text-gray-800 text-sm">Histórico de Saúde Recente</h2>
            <Link to="/health" className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap">
              Ver tudo
            </Link>
          </div>
          {recentHealth.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-100 text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-heart-pulse-line text-gray-300 text-xl"></i>
              </div>
              <p className="text-sm text-gray-500">Nenhum registro de saúde ainda</p>
              <p className="text-xs text-gray-400 mt-1">Adicione consultas, vacinas e pesagens dos seus pets</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentHealth.map(h => {
                const pet = getPetById(h.petId);
                return (
                  <div key={h.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">{healthTypeLabels[h.type]}</span>
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
