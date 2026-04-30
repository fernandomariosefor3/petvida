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

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Olá, {currentUser.name.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">
            {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pets', value: pets.length, icon: 'ri-heart-2-line', color: 'emerald', sub: 'cadastrados' },
            { label: 'Lembretes', value: upcoming.length, icon: 'ri-alarm-line', color: 'amber', sub: 'próximos' },
            { label: 'Atrasados', value: overdue.length, icon: 'ri-error-warning-line', color: 'rose', sub: 'lembretes' },
            { label: 'Concluídos', value: completed.length, icon: 'ri-checkbox-circle-line', color: 'teal', sub: 'este mês' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color === 'emerald' ? 'bg-emerald-50' : stat.color === 'amber' ? 'bg-amber-50' : stat.color === 'rose' ? 'bg-rose-50' : 'bg-teal-50'}`}>
                <i className={`${stat.icon} text-lg ${stat.color === 'emerald' ? 'text-emerald-600' : stat.color === 'amber' ? 'text-amber-600' : stat.color === 'rose' ? 'text-rose-600' : 'text-teal-600'}`}></i>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label} <span className="text-gray-300">•</span> {stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Upgrade banner for free users */}
          {!isPremium && (
            <div className="lg:col-span-3 bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl p-5 flex items-center justify-between">
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
              <h2 className="font-semibold text-gray-800">Meus Pets</h2>
              <Link to="/pets" className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap">
                Ver todos <i className="ri-arrow-right-line text-xs"></i>
              </Link>
            </div>
            <div className="space-y-3">
              {pets.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="ri-heart-2-line text-gray-300 text-xl"></i>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">Nenhum pet cadastrado ainda</p>
                  <Link to="/pets" className="inline-flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-full cursor-pointer whitespace-nowrap">
                    <i className="ri-add-line"></i> Adicionar pet
                  </Link>
                </div>
              ) : (
                pets.map(pet => (
                  <Link key={pet.id} to={`/pets/${pet.id}`} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover object-top" />
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
                <Link to="/pets" className="flex items-center justify-center gap-2 bg-white rounded-2xl p-3 border border-dashed border-gray-200 text-sm text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-all cursor-pointer">
                  <i className="ri-add-line"></i> Novo pet
                </Link>
              )}
            </div>
          </div>

          {/* Próximos Lembretes */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Próximos Lembretes</h2>
              <Link to="/reminders" className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap">
                Ver todos <i className="ri-arrow-right-line text-xs"></i>
              </Link>
            </div>
            <div className="space-y-3">
              {overdue.length > 0 && (
                <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex items-center gap-3">
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
                <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="ri-alarm-line text-gray-300 text-xl"></i>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">Nenhum lembrete próximo</p>
                  <Link to="/reminders" className="inline-flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-full cursor-pointer whitespace-nowrap">
                    <i className="ri-add-line"></i> Novo lembrete
                  </Link>
                </div>
              ) : (
                upcoming.map(r => {
                  const pet = getPetById(r.petId);
                  const daysUntil = getDaysUntil(r.date);
                  return (
                    <div key={r.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
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
            <h2 className="font-semibold text-gray-800">Histórico Recente de Saúde</h2>
            <Link to="/health" className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap">
              Ver tudo <i className="ri-arrow-right-line text-xs"></i>
            </Link>
          </div>
          {recentHealth.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
              <p className="text-sm text-gray-400">Nenhum registro de saúde ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentHealth.map(h => {
                const pet = getPetById(h.petId);
                return (
                  <div key={h.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{healthTypeLabels[h.type]}</span>
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
