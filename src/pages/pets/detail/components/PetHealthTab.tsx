import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { HealthRecord } from '@/types';

type HealthFormData = Omit<HealthRecord, 'id' | 'userId' | 'createdAt'>;

const typeOptions = [
  { value: 'appointment' as const, label: 'Consulta', icon: 'ri-stethoscope-line', color: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' } },
  { value: 'vaccine' as const, label: 'Vacina', icon: 'ri-syringe-line', color: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' } },
  { value: 'weight' as const, label: 'Pesagem', icon: 'ri-scales-line', color: { bg: 'bg-teal-50', text: 'text-teal-600', badge: 'bg-teal-100 text-teal-700' } },
  { value: 'exam' as const, label: 'Exame', icon: 'ri-test-tube-line', color: { bg: 'bg-indigo-50', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' } },
  { value: 'surgery' as const, label: 'Cirurgia', icon: 'ri-surgical-mask-line', color: { bg: 'bg-rose-50', text: 'text-rose-600', badge: 'bg-rose-100 text-rose-700' } },
  { value: 'other' as const, label: 'Outro', icon: 'ri-clipboard-line', color: { bg: 'bg-gray-50', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' } },
];

interface Props {
  petId: string;
}

export default function PetHealthTab({ petId }: Props) {
  const { healthRecords, addHealthRecord, updateHealthRecord, deleteHealthRecord } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<HealthFormData>({
    petId, type: 'appointment', date: '', weight: undefined, notes: '', vet: '', clinic: '',
  });

  const records = healthRecords
    .filter(h => h.petId === petId)
    .filter(h => typeFilter === 'all' || h.type === typeFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const openAdd = () => {
    setForm({ petId, type: 'appointment', date: '', weight: undefined, notes: '', vet: '', clinic: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (h: HealthRecord) => {
    setForm({ petId: h.petId, type: h.type, date: h.date, weight: h.weight, notes: h.notes, vet: h.vet, clinic: h.clinic });
    setEditingId(h.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateHealthRecord(editingId, form);
    } else {
      await addHealthRecord(form);
    }
    setShowForm(false);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
        >
          <option value="all">Todos os tipos</option>
          {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line"></i> Novo registro
        </button>
      </div>

      {/* Records list */}
      {records.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-heart-pulse-line text-gray-300 text-2xl"></i>
          </div>
          <p className="text-gray-400 text-sm mb-4">Nenhum registro de saúde ainda.</p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line"></i> Adicionar primeiro registro
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(h => {
            const typeOpt = typeOptions.find(t => t.value === h.type)!;
            const isExpanded = expandedId === h.id;
            return (
              <div key={h.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : h.id)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeOpt.color.bg}`}>
                    <i className={`${typeOpt.icon} text-sm ${typeOpt.color.text}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeOpt.color.badge}`}>{typeOpt.label}</span>
                      {h.weight && <span className="text-xs text-gray-400">{h.weight} kg</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{h.notes || '—'}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400">
                        <i className="ri-calendar-line mr-1"></i>{formatDate(h.date)}
                      </span>
                      {h.vet && <span className="text-xs text-gray-400"><i className="ri-user-heart-line mr-1"></i>{h.vet}</span>}
                      {h.clinic && <span className="text-xs text-gray-400"><i className="ri-hospital-line mr-1"></i>{h.clinic}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(h); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                    >
                      <i className="ri-edit-line text-sm"></i>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(h.id); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 cursor-pointer transition-colors"
                    >
                      <i className="ri-delete-bin-line text-sm"></i>
                    </button>
                    <div className="w-5 h-5 flex items-center justify-center ml-1">
                      <i className={`text-gray-400 text-sm ${isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>
                    </div>
                  </div>
                </div>
                {isExpanded && h.notes && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed pt-3">{h.notes}</p>
                  </div>
                )}
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
              <h2 className="font-bold text-gray-800 text-lg">{editingId ? 'Editar Registro' : 'Novo Registro de Saúde'}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo *</label>
                <div className="grid grid-cols-3 gap-2">
                  {typeOptions.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${form.type === t.value ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <i className={`${t.icon} text-sm ${form.type === t.value ? 'text-emerald-600' : 'text-gray-400'}`}></i>
                      <span className={`text-xs font-medium ${form.type === t.value ? 'text-emerald-600' : 'text-gray-400'}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
                  <input type="date" value={form.date} required onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Peso (kg)</label>
                  <input type="number" step="0.1" min="0" value={form.weight || ''} placeholder="Ex: 28.5"
                    onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Veterinário</label>
                <input type="text" value={form.vet} placeholder="Nome do veterinário"
                  onChange={e => setForm({ ...form, vet: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Clínica / Hospital</label>
                <input type="text" value={form.clinic} placeholder="Nome da clínica"
                  onChange={e => setForm({ ...form, clinic: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
                <textarea value={form.notes} rows={3} maxLength={500} placeholder="Diagnóstico, medicamentos, recomendações..."
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap">
                  {editingId ? 'Salvar' : 'Adicionar'}
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
            <h3 className="font-bold text-gray-800 mb-2">Remover registro?</h3>
            <p className="text-gray-400 text-sm mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm cursor-pointer whitespace-nowrap">Cancelar</button>
              <button
                onClick={() => { deleteHealthRecord(deleteConfirm); setDeleteConfirm(null); }}
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
