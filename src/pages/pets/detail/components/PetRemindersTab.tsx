import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Reminder } from '@/types';

type ReminderFormData = Omit<Reminder, 'id' | 'userId' | 'createdAt' | 'completed'>;
type FilterType = 'all' | 'pending' | 'completed' | 'overdue';

const typeOptions = [
  { value: 'vaccine' as const, label: 'Vacina', icon: 'ri-syringe-line', color: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' } },
  { value: 'appointment' as const, label: 'Consulta', icon: 'ri-stethoscope-line', color: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' } },
  { value: 'medication' as const, label: 'Medicamento', icon: 'ri-capsule-line', color: { bg: 'bg-rose-50', text: 'text-rose-600', badge: 'bg-rose-100 text-rose-700' } },
  { value: 'grooming' as const, label: 'Banho/Tosa', icon: 'ri-scissors-line', color: { bg: 'bg-violet-50', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' } },
  { value: 'other' as const, label: 'Outro', icon: 'ri-calendar-line', color: { bg: 'bg-gray-50', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' } },
];

interface Props {
  petId: string;
  petName: string;
}

export default function PetRemindersTab({ petId, petName }: Props) {
  const { reminders, addReminder, updateReminder, deleteReminder, toggleReminder } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [form, setForm] = useState<ReminderFormData>({
    petId, title: '', type: 'vaccine', date: '', time: '09:00', notes: '',
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const petReminders = reminders.filter(r => r.petId === petId);

  const filtered = petReminders
    .filter(r => {
      switch (filter) {
        case 'pending': return !r.completed && new Date(r.date) >= today;
        case 'completed': return r.completed;
        case 'overdue': return !r.completed && new Date(r.date) < today;
        default: return true;
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pendingCount = petReminders.filter(r => !r.completed && new Date(r.date) >= today).length;
  const overdueCount = petReminders.filter(r => !r.completed && new Date(r.date) < today).length;
  const completedCount = petReminders.filter(r => r.completed).length;

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const getDaysLabel = (d: string, completed: boolean) => {
    if (completed) return null;
    const dt = new Date(d + 'T00:00:00');
    const diff = Math.ceil((dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)}d atrasado`, cls: 'text-rose-600 bg-rose-50' };
    if (diff === 0) return { text: 'Hoje', cls: 'text-rose-600 bg-rose-50' };
    if (diff === 1) return { text: 'Amanhã', cls: 'text-amber-600 bg-amber-50' };
    return { text: `${diff} dias`, cls: diff <= 7 ? 'text-amber-600 bg-amber-50' : 'text-gray-500 bg-gray-50' };
  };

  const openAdd = () => {
    setForm({ petId, title: '', type: 'vaccine', date: '', time: '09:00', notes: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (r: Reminder) => {
    setForm({ petId: r.petId, title: r.title, type: r.type, date: r.date, time: r.time, notes: r.notes });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateReminder(editingId, form);
    } else {
      await addReminder({ ...form, completed: false });
    }
    setShowForm(false);
  };

  const filterTabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: petReminders.length },
    { key: 'pending', label: 'Pendentes', count: pendingCount },
    { key: 'overdue', label: 'Atrasados', count: overdueCount },
    { key: 'completed', label: 'Concluídos', count: completedCount },
  ];

  return (
    <div>
      {/* Filter tabs + Add */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex flex-1 bg-white rounded-xl p-1 border border-gray-100 gap-1">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter === tab.key ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
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
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line"></i> Novo
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-alarm-line text-gray-300 text-2xl"></i>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            {filter === 'all'
              ? `Nenhum lembrete para ${petName} ainda.`
              : `Nenhum lembrete ${filter === 'completed' ? 'concluído' : filter === 'overdue' ? 'atrasado' : 'pendente'}.`}
          </p>
          {filter === 'all' && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line"></i> Criar primeiro lembrete
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const typeOpt = typeOptions.find(t => t.value === r.type)!;
            const daysLabel = getDaysLabel(r.date, r.completed);
            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border p-4 transition-all ${r.completed ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:border-emerald-200'}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleReminder(r.id)}
                    className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${r.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'}`}
                  >
                    {r.completed && <i className="ri-check-line text-white text-xs"></i>}
                  </button>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeOpt.color.bg}`}>
                    <i className={`${typeOpt.icon} text-sm ${typeOpt.color.text}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-sm ${r.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{r.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeOpt.color.badge}`}>{typeOpt.label}</span>
                      {daysLabel && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${daysLabel.cls}`}>{daysLabel.text}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400">
                        <i className="ri-calendar-line mr-1"></i>{formatDate(r.date)}{r.time && ` • ${r.time}`}
                      </span>
                    </div>
                    {r.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(r)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                    >
                      <i className="ri-edit-line text-sm"></i>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(r.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 cursor-pointer transition-colors"
                    >
                      <i className="ri-delete-bin-line text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo *</label>
                <div className="grid grid-cols-5 gap-2">
                  {typeOptions.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })}
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
                <input type="text" value={form.title} required placeholder="Ex: Vacina antirrábica..."
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
                  <input type="date" value={form.date} required
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora</label>
                  <input type="time" value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
                <textarea value={form.notes} rows={2} maxLength={500} placeholder="Informações adicionais..."
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap">
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
              <button
                onClick={() => { deleteReminder(deleteConfirm); setDeleteConfirm(null); }}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl text-sm cursor-pointer whitespace-nowrap"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
