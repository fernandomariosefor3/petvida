import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Reminder } from '@/types';

type ReminderFormData = Omit<Reminder, 'id' | 'userId' | 'createdAt' | 'completed'>;

const typeOptions: { value: Reminder['type']; label: string; icon: string; color: string }[] = [
  { value: 'vaccine', label: 'Vacina', icon: 'ri-syringe-line', color: 'emerald' },
  { value: 'appointment', label: 'Consulta', icon: 'ri-stethoscope-line', color: 'amber' },
  { value: 'medication', label: 'Medicamento', icon: 'ri-capsule-line', color: 'rose' },
  { value: 'grooming', label: 'Banho/Tosa', icon: 'ri-scissors-line', color: 'violet' },
  { value: 'other', label: 'Outro', icon: 'ri-calendar-line', color: 'gray' },
];

const typeColorMap: Record<string, { bg: string; text: string; badge: string }> = {
  vaccine: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  appointment: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  medication: { bg: 'bg-rose-50', text: 'text-rose-600', badge: 'bg-rose-100 text-rose-700' },
  grooming: { bg: 'bg-violet-50', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  other: { bg: 'bg-gray-50', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' },
};

const defaultForm: ReminderFormData = {
  petId: '', title: '', type: 'vaccine', date: '', time: '09:00', notes: '',
};

type FilterType = 'all' | 'pending' | 'completed' | 'overdue';

export default function RemindersPage() {
  const { currentUser, pets, reminders, addReminder, updateReminder, deleteReminder, toggleReminder, getPetById } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReminderFormData>(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  if (!currentUser) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getFilteredReminders = () => {
    let list = reminders;
    if (search) {
      list = list.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (getPetById(r.petId)?.name || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    switch (filter) {
      case 'pending': return list.filter(r => !r.completed && new Date(r.date) >= today);
      case 'completed': return list.filter(r => r.completed);
      case 'overdue': return list.filter(r => !r.completed && new Date(r.date) < today);
      default: return list;
    }
  };

  const filtered = getFilteredReminders().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pendingCount = reminders.filter(r => !r.completed && new Date(r.date) >= today).length;
  const overdueCount = reminders.filter(r => !r.completed && new Date(r.date) < today).length;
  const completedCount = reminders.filter(r => r.completed).length;

  const openAdd = () => {
    setForm({ ...defaultForm, petId: pets[0]?.id || '' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (r: Reminder) => {
    setForm({ petId: r.petId, title: r.title, type: r.type, date: r.date, time: r.time, notes: r.notes });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateReminder(editingId, form);
    } else {
      addReminder({ ...form, completed: false });
    }
    setShowForm(false);
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDaysLabel = (d: string, completed: boolean) => {
    if (completed) return null;
    const dt = new Date(d + 'T00:00:00');
    const diff = Math.ceil((dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)}d atrasado`, cls: 'text-rose-600 bg-rose-50' };
    if (diff === 0) return { text: 'Hoje', cls: 'text-rose-600 bg-rose-50' };
    if (diff === 1) return { text: 'Amanhã', cls: 'text-amber-600 bg-amber-50' };
    if (diff <= 7) return { text: `${diff} dias`, cls: 'text-amber-600 bg-amber-50' };
    return { text: `${diff} dias`, cls: 'text-gray-500 bg-gray-50' };
  };

  const filterTabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: reminders.length },
    { key: 'pending', label: 'Pendentes', count: pendingCount },
    { key: 'overdue', label: 'Atrasados', count: overdueCount },
    { key: 'completed', label: 'Concluídos', count: completedCount },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Lembretes</h1>
            <p className="text-sm text-gray-500 mt-0.5">{pendingCount} pendente{pendingCount !== 1 ? 's' : ''}{overdueCount > 0 ? ` • ${overdueCount} atrasado${overdueCount > 1 ? 's' : ''}` : ''}</p>
          </div>
          <button
            onClick={openAdd}
            disabled={pets.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line"></i> Novo lembrete
          </button>
        </div>

        {pets.length === 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <i className="ri-information-line text-amber-500"></i>
            </div>
            <p className="text-sm text-amber-700">Cadastre um pet primeiro para criar lembretes.</p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex bg-white rounded-xl p-1 border border-gray-100 mb-5 gap-1">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter === tab.key ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
            <i className="ri-search-line text-gray-400 text-sm"></i>
          </div>
          <input
            type="text"
            placeholder="Buscar lembretes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
          />
        </div>

        {/* Reminders list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-alarm-line text-gray-300 text-2xl"></i>
            </div>
            <p className="text-gray-400 text-sm">
              {filter === 'all' ? 'Nenhum lembrete criado ainda.' : `Nenhum lembrete ${filter === 'completed' ? 'concluído' : filter === 'overdue' ? 'atrasado' : 'pendente'}.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const pet = getPetById(r.petId);
              const typeOpt = typeOptions.find(t => t.value === r.type)!;
              const colors = typeColorMap[r.type];
              const daysLabel = getDaysLabel(r.date, r.completed);

              return (
                <div key={r.id} className={`bg-white rounded-2xl border p-4 transition-all ${r.completed ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:border-emerald-200'}`}>
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleReminder(r.id)}
                      className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${r.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'}`}
                    >
                      {r.completed && <i className="ri-check-line text-white text-xs"></i>}
                    </button>

                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                      <i className={`${typeOpt.icon} text-sm ${colors.text}`}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold text-sm ${r.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{r.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>{typeOpt.label}</span>
                        {daysLabel && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${daysLabel.cls}`}>{daysLabel.text}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {pet && <span className="text-xs text-gray-400"><i className="ri-heart-2-line mr-1"></i>{pet.name}</span>}
                        <span className="text-xs text-gray-400"><i className="ri-calendar-line mr-1"></i>{formatDate(r.date)} {r.time && `• ${r.time}`}</span>
                      </div>
                      {r.notes && <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{r.notes}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(r)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      <button onClick={() => setDeleteConfirm(r.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 cursor-pointer transition-colors">
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-lg">{editingId ? 'Editar Lembrete' : 'Novo Lembrete'}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pet *</label>
                <select value={form.petId} onChange={e => setForm({...form, petId: e.target.value})} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 cursor-pointer">
                  <option value="">Selecione o pet</option>
                  {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo *</label>
                <div className="grid grid-cols-5 gap-2">
                  {typeOptions.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({...form, type: t.value})}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all cursor-pointer ${form.type === t.value ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <i className={`${t.icon} text-base ${form.type === t.value ? 'text-emerald-600' : 'text-gray-400'}`}></i>
                      <span className={`text-xs font-medium ${form.type === t.value ? 'text-emerald-600' : 'text-gray-400'}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Título *</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Ex: Vacina antirrábica..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora</label>
                  <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} maxLength={500} placeholder="Informações adicionais..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap">
                  {editingId ? 'Salvar' : 'Criar lembrete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="ri-delete-bin-line text-rose-500 text-xl"></i>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Remover lembrete?</h3>
            <p className="text-gray-400 text-sm mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm cursor-pointer whitespace-nowrap">Cancelar</button>
              <button onClick={() => { deleteReminder(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl text-sm cursor-pointer whitespace-nowrap">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
