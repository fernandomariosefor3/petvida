import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { computeCareStreak, streakBadge } from '@/lib/streak';

const STREAK_CELEBRATED_KEY = 'petvida_streak_celebrated';

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
  const { currentUser, pets, reminders, healthRecords, getPetById, isPro, toggleReminder } = useApp();
  const [celebration, setCelebration] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const streak = computeCareStreak(reminders, today);
  const badge = streakBadge(streak);

  useEffect(() => {
    if (!badge) return;
    const lastCelebrated = localStorage.getItem(STREAK_CELEBRATED_KEY);
    if (lastCelebrated === badge.label) return;
    localStorage.setItem(STREAK_CELEBRATED_KEY, badge.label);
    setCelebration(`${badge.emoji} Você bateu ${badge.label} de sequência cuidando dos seus pets!`);
    const t = setTimeout(() => setCelebration(null), 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badge?.label]);

  if (!currentUser) return null;

  const in7Days = (d: string) => {
    const diff = Math.floor((new Date(d + 'T00:00:00').getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  };

  const upcoming = reminders
    .filter(r => !r.completed && in7Days(r.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const overdue = reminders
    .filter(r => !r.completed && new Date(r.date) < today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

  const Paw = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <ellipse cx="6" cy="7" rx="2" ry="2.5"/><ellipse cx="11" cy="5" rx="2" ry="2.5"/>
      <ellipse cx="16" cy="7" rx="2" ry="2.5"/><ellipse cx="18.5" cy="12" rx="1.5" ry="2"/>
      <path d="M12 10c-3.5 0-7 2.5-7 6 0 2.5 2 4 4 4h6c2 0 4-1.5 4-4 0-3.5-3.5-6-7-6z"/>
    </svg>
  );

  const statGradients: Record<string, string> = {
    pets:      'linear-gradient(135deg,#f97316,#fb923c)',
    upcoming:  'linear-gradient(135deg,#f59e0b,#fbbf24)',
    overdue:   'linear-gradient(135deg,#ef4444,#f87171)',
    completed: 'linear-gradient(135deg,#10b981,#34d399)',
  };

  return (
    <div className="flex-1 overflow-y-auto relative" style={{ background: 'linear-gradient(180deg,#fff7ed 0%,#f8fafc 40%)' }}>

      {/* Hero header */}
      <div className="relative overflow-hidden" style={{ minHeight: 180 }}>
        {/* Foto de fundo grande */}
        <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&h=360&fit=crop&auto=format" alt="" className="absolute inset-0 w-full h-full object-cover" />
        {/* Overlay gradiente colorido */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(234,88,12,0.82) 0%,rgba(251,146,60,0.70) 50%,rgba(251,191,36,0.60) 100%)' }} />
        {/* Patas grandes */}
        <Paw className="absolute top-2 left-4 w-14 h-14 text-white opacity-20" />
        <Paw className="absolute bottom-3 left-20 w-8 h-8 text-white opacity-25" />
        <Paw className="absolute top-4 left-32 w-6 h-6 text-white opacity-15" />
        {/* Fotos circulares de pets flutuando à direita */}
        <div className="absolute right-4 bottom-0 top-0 flex items-center gap-2 pr-1">
          <img src="https://images.unsplash.com/photo-1574158622682-e40e69881006?w=100&h=100&fit=crop&auto=format" alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white/60 shadow-lg" />
          <img src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop&auto=format" alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/60 shadow-lg" />
          <img src="https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=100&h=100&fit=crop&auto=format" alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/60 shadow-lg" />
        </div>
        <div className="relative z-10 px-6 py-8">
          <p className="text-orange-100 text-sm mb-1">🐾 Bem-vindo de volta!</p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">Olá, {currentUser.name.split(' ')[0]}! 🐶🐱</h1>
            {badge && (
              <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 rounded-full px-3 py-1 text-white text-xs font-bold">
                {badge.emoji} {streak} dias em dia
              </span>
            )}
          </div>
          <p className="text-orange-100 text-sm mt-1">
            {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {celebration && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-xl border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3 max-w-xs">
          <span className="text-2xl">🎉</span>
          <p className="text-sm text-gray-700 font-medium">{celebration}</p>
        </div>
      )}

      {/* Faixa decorativa de pets */}
      <div className="flex gap-0 overflow-hidden" style={{ height: 90 }}>
        <img src="https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=300&h=180&fit=crop&auto=format" alt="" className="flex-1 object-cover object-center opacity-60" />
        <img src="https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=180&fit=crop&auto=format" alt="" className="flex-1 object-cover object-center opacity-60" />
        <img src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&h=180&fit=crop&auto=format" alt="" className="flex-1 object-cover object-center opacity-60" />
        <img src="https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=300&h=180&fit=crop&auto=format" alt="" className="flex-1 object-cover object-center opacity-60" />
        <img src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=300&h=180&fit=crop&auto=format" alt="" className="flex-1 object-cover object-center opacity-60 hidden sm:block" />
      </div>

      <div className="p-6 max-w-6xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 -mt-4">
          {statConfig.map(cfg => (
            <div key={cfg.key} className="rounded-xl p-5 shadow-md text-white relative overflow-hidden" style={{ background: statGradients[cfg.key] }}>
              <Paw className="absolute -bottom-2 -right-2 w-12 h-12 text-white opacity-10" />
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <i className={`${cfg.icon} text-base text-white`}></i>
              </div>
              <p className="text-2xl font-bold">{statValues[cfg.key]}</p>
              <p className="text-xs text-white/80 mt-0.5">{cfg.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Upgrade banner for free users */}
          {!isPro && (
            <div className="lg:col-span-3 bg-orange-500 rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-vip-crown-line text-white text-xl"></i>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Desbloqueie todo o potencial do PetVida</p>
                  <p className="text-orange-100 text-xs mt-0.5">Export em PDF do histórico por R$14,99/ano</p>
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
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img
                        src={pet.photo || (pet.species === 'Gato'
                          ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=80&h=80&fit=crop&auto=format'
                          : pet.species === 'Pássaro'
                          ? 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=80&h=80&fit=crop&auto=format'
                          : pet.species === 'Coelho'
                          ? 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=80&h=80&fit=crop&auto=format'
                          : 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=80&h=80&fit=crop&auto=format')}
                        alt={pet.name}
                        className="w-full h-full object-cover object-top"
                      />
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
              <h2 className="font-semibold text-gray-800 text-sm">
                Próximos 7 dias
                {upcoming.length > 0 && <span className="text-gray-400 font-normal ml-1.5">· {upcoming.length} lembrete{upcoming.length !== 1 ? 's' : ''} esta semana</span>}
              </h2>
              <Link to="/reminders" className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap">
                Ver todos
              </Link>
            </div>
            <div className="space-y-2">
              {overdue.length > 0 && (
                <div className="bg-rose-50 rounded-xl border border-rose-100 overflow-hidden mb-1">
                  <div className="px-3.5 py-2.5 flex items-center gap-2 border-b border-rose-100/70">
                    <i className="ri-error-warning-line text-rose-500 text-sm flex-shrink-0"></i>
                    <p className="text-sm font-semibold text-rose-700">{overdue.length} lembrete{overdue.length > 1 ? 's' : ''} atrasado{overdue.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="divide-y divide-rose-100/70">
                    {overdue.map(r => {
                      const pet = getPetById(r.petId);
                      return (
                        <div key={r.id} className="px-3.5 py-2.5 flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                            <p className="text-xs text-rose-500">{pet?.name || '—'} · {formatDate(r.date)}</p>
                          </div>
                          <button
                            onClick={() => toggleReminder(r.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white cursor-pointer whitespace-nowrap flex-shrink-0"
                          >
                            Fazer agora
                          </button>
                        </div>
                      );
                    })}
                  </div>
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
                        <p className={`text-xs font-semibold ${daysUntil === 'Hoje' ? 'text-amber-600' : daysUntil === 'Amanhã' ? 'text-blue-600' : 'text-gray-500'}`}>{daysUntil}</p>
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
