import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { HealthRecord } from '@/types';

type HealthFormData = Omit<HealthRecord, 'id' | 'userId' | 'createdAt'>;

const typeOptions: { value: HealthRecord['type']; label: string; icon: string; color: string; emoji: string }[] = [
  { value: 'appointment', label: 'Consulta', icon: 'ri-stethoscope-line', color: 'amber', emoji: '🩺' },
  { value: 'vaccine', label: 'Vacina', icon: 'ri-syringe-line', color: 'emerald', emoji: '💉' },
  { value: 'weight', label: 'Pesagem', icon: 'ri-scales-line', color: 'teal', emoji: '⚖️' },
  { value: 'exam', label: 'Exame', icon: 'ri-test-tube-line', color: 'indigo', emoji: '🔬' },
  { value: 'surgery', label: 'Cirurgia', icon: 'ri-surgical-mask-line', color: 'rose', emoji: '🏥' },
  { value: 'other', label: 'Outro', icon: 'ri-clipboard-line', color: 'gray', emoji: '📋' },
];

const typeColorMap: Record<string, { bg: string; text: string; badge: string; gradient: string; border: string }> = {
  appointment: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', gradient: 'from-amber-50 to-orange-50', border: 'border-amber-100' },
  vaccine:     { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', gradient: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
  weight:      { bg: 'bg-teal-50', text: 'text-teal-600', badge: 'bg-teal-100 text-teal-700', gradient: 'from-teal-50 to-cyan-50', border: 'border-teal-100' },
  exam:        { bg: 'bg-indigo-50', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700', gradient: 'from-indigo-50 to-violet-50', border: 'border-indigo-100' },
  surgery:     { bg: 'bg-rose-50', text: 'text-rose-600', badge: 'bg-rose-100 text-rose-700', gradient: 'from-rose-50 to-pink-50', border: 'border-rose-100' },
  other:       { bg: 'bg-gray-50', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700', gradient: 'from-gray-50 to-slate-50', border: 'border-gray-100' },
};

const defaultForm: HealthFormData = {
  petId: '', type: 'appointment', date: '', weight: undefined, notes: '', vet: '', clinic: '',
};

const PawBg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <ellipse cx="6" cy="7" rx="2" ry="2.5"/>
    <ellipse cx="11" cy="5" rx="2" ry="2.5"/>
    <ellipse cx="16" cy="7" rx="2" ry="2.5"/>
    <ellipse cx="18.5" cy="12" rx="1.5" ry="2"/>
    <path d="M12 10c-3.5 0-7 2.5-7 6 0 2.5 2 4 4 4h6c2 0 4-1.5 4-4 0-3.5-3.5-6-7-6z"/>
  </svg>
);

export default function HealthPage() {
  const { currentUser, pets, healthRecords, addHealthRecord, updateHealthRecord, deleteHealthRecord, getPetById } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HealthFormData>(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedPet, setSelectedPet] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  if (!currentUser) return null;

  const filtered = healthRecords
    .filter(h => selectedPet === 'all' || h.petId === selectedPet)
    .filter(h => selectedType === 'all' || h.type === selectedType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const openAdd = () => {
    setForm({ ...defaultForm, petId: pets[0]?.id || '' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (h: HealthRecord) => {
    setForm({ petId: h.petId, type: h.type, date: h.date, weight: h.weight, notes: h.notes, vet: h.vet, clinic: h.clinic });
    setEditingId(h.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) { updateHealthRecord(editingId, form); }
    else { addHealthRecord(form); }
    setShowForm(false);
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const weightPetId = selectedPet !== 'all' ? selectedPet : pets[0]?.id;
  const weightRecords = healthRecords
    .filter(h => h.petId === weightPetId && h.weight && h.weight > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const latestWeight = weightRecords[weightRecords.length - 1];
  const prevWeight = weightRecords[weightRecords.length - 2];
  const weightDiff = latestWeight && prevWeight && latestWeight.weight && prevWeight.weight
    ? (latestWeight.weight - prevWeight.weight).toFixed(1) : null;

  const statCards = [
    { label: 'Total de registros', value: healthRecords.length, icon: 'ri-clipboard-line', emoji: '📋', type: 'all', gradient: 'from-teal-400 to-emerald-500', bg: 'from-teal-50 to-emerald-50', border: 'border-teal-100', text: 'text-teal-700' },
    { label: 'Consultas', value: healthRecords.filter(h => h.type === 'appointment').length, icon: 'ri-stethoscope-line', emoji: '🩺', type: 'appointment', gradient: 'from-amber-400 to-orange-500', bg: 'from-amber-50 to-orange-50', border: 'border-amber-100', text: 'text-amber-700' },
    { label: 'Vacinas', value: healthRecords.filter(h => h.type === 'vaccine').length, icon: 'ri-syringe-line', emoji: '💉', type: 'vaccine', gradient: 'from-emerald-400 to-teal-500', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100', text: 'text-emerald-700' },
    { label: 'Pesagens', value: healthRecords.filter(h => h.type === 'weight').length, icon: 'ri-scales-line', emoji: '⚖️', type: 'weight', gradient: 'from-indigo-400 to-violet-500', bg: 'from-indigo-50 to-violet-50', border: 'border-indigo-100', text: 'text-indigo-700' },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #f0fdf4 50%, #eff6ff 100%)' }}>
      <div className="p-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">🏥 Saúde</h1>
            <p className="text-sm text-gray-500 mt-0.5">{healthRecords.length} registro{healthRecords.length !== 1 ? 's' : ''} de saúde</p>
          </div>
          <button
            onClick={openAdd}
            disabled={pets.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap shadow-sm hover:shadow-md"
          >
            <i className="ri-add-line"></i> Novo registro
          </button>
        </div>

        {/* Summary cards */}
        {pets.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map(stat => (
              <button
                key={stat.label}
                onClick={() => setSelectedType(selectedType === stat.type ? 'all' : stat.type)}
                className={`bg-gradient-to-br ${selectedType === stat.type ? stat.bg : 'from-white to-white'} rounded-2xl p-4 border ${selectedType === stat.type ? stat.border : 'border-gray-100'} text-left transition-all cursor-pointer hover:shadow-sm relative overflow-hidden`}
              >
                <div className="absolute top-1 right-1 w-8 h-8 opacity-10 pointer-events-none">
                  <PawBg />
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${stat.gradient} shadow-sm`}>
                  <i className={`${stat.icon} text-base text-white`}></i>
                </div>
                <p className={`text-2xl font-bold ${selectedType === stat.type ? stat.text : 'text-gray-800'}`}>{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.label} {stat.emoji}</p>
              </button>
            ))}
          </div>
        )}

        {/* Weight tracker */}
        {weightRecords.length > 0 && (
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-100 p-5 mb-6 shadow-sm relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-24 h-24 opacity-10 text-teal-400 pointer-events-none"><PawBg /></div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">⚖️ Evolução do Peso</h2>
              {pets.length > 1 && (
                <select value={weightPetId} onChange={e => setSelectedPet(e.target.value)} className="text-xs border border-teal-200 rounded-lg px-2 py-1 focus:outline-none bg-white cursor-pointer">
                  {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            </div>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-3xl font-bold text-teal-700">{latestWeight?.weight} <span className="text-lg text-teal-400 font-normal">kg</span></p>
                <p className="text-xs text-gray-400 mt-1">Último registro • {latestWeight && formatDate(latestWeight.date)}</p>
              </div>
              {weightDiff !== null && (
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold ${parseFloat(weightDiff) > 0 ? 'bg-amber-100 text-amber-700' : parseFloat(weightDiff) < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <i className={`text-xs ${parseFloat(weightDiff) > 0 ? 'ri-arrow-up-line' : parseFloat(weightDiff) < 0 ? 'ri-arrow-down-line' : 'ri-subtract-line'}`}></i>
                  {Math.abs(parseFloat(weightDiff))} kg
                </div>
              )}
            </div>
            {weightRecords.length > 1 && (
              <div className="mt-5 flex items-end gap-2 h-16">
                {weightRecords.slice(-8).map((r, i) => {
                  const allWeights = weightRecords.slice(-8).map(w => w.weight || 0);
                  const maxW = Math.max(...allWeights);
                  const minW = Math.min(...allWeights);
                  const range = maxW - minW || 1;
                  const heightPct = ((r.weight || 0) - minW) / range;
                  const barH = Math.max(8, Math.round(heightPct * 44) + 8);
                  const isLast = i === weightRecords.slice(-8).length - 1;
                  return (
                    <div key={r.id} className="flex-1 flex flex-col items-center gap-1" title={`${r.weight}kg — ${formatDate(r.date)}`}>
                      <div style={{ height: barH }} className={`w-full rounded-t-lg transition-all ${isLast ? 'bg-teal-500' : 'bg-teal-200'}`}></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <select value={selectedPet} onChange={e => setSelectedPet(e.target.value)} className="flex-1 px-3 py-2.5 bg-white border border-orange-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer shadow-sm">
            <option value="all">Todos os pets</option>
            {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="flex-1 px-3 py-2.5 bg-white border border-orange-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer shadow-sm">
            <option value="all">Todos os tipos</option>
            {typeOptions.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
          </select>
        </div>

        {/* Records */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-orange-100 text-center relative overflow-hidden shadow-sm">
            <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5 text-orange-400 pointer-events-none"><PawBg /></div>
            <div className="text-6xl mb-4">🩺</div>
            <p className="text-gray-500 text-sm font-medium">Nenhum registro de saúde encontrado.</p>
            <p className="text-gray-400 text-xs mt-1">Registre consultas, vacinas e pesagens dos seus pets</p>
            {pets.length > 0 && (
              <button onClick={openAdd} className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl cursor-pointer whitespace-nowrap shadow-sm transition-colors">
                <i className="ri-add-line"></i> Adicionar registro
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(h => {
              const pet = getPetById(h.petId);
              const typeOpt = typeOptions.find(t => t.value === h.type)!;
              const colors = typeColorMap[h.type];
              const isExpanded = expandedRecord === h.id;

              return (
                <div key={h.id} className={`bg-gradient-to-r ${colors.gradient} rounded-2xl border ${colors.border} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                  <div
                    className="flex items-start gap-3 p-4 cursor-pointer"
                    onClick={() => setExpandedRecord(isExpanded ? null : h.id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} shadow-sm`}>
                      <span className="text-lg">{typeOpt.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>{typeOpt.label}</span>
                        {pet && <span className="text-xs font-semibold text-gray-700">🐾 {pet.name}</span>}
                        {h.weight && <span className="text-xs text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">⚖️ {h.weight} kg</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">{h.notes || '—'}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400"><i className="ri-calendar-line mr-1"></i>{formatDate(h.date)}</span>
                        {h.vet && <span className="text-xs text-gray-400"><i className="ri-user-heart-line mr-1"></i>{h.vet}</span>}
                        {h.clinic && <span className="text-xs text-gray-400"><i className="ri-hospital-line mr-1"></i>{h.clinic}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); openEdit(h); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600 cursor-pointer">
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteConfirm(h.id); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-500 cursor-pointer">
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                      <div className="w-5 h-5 flex items-center justify-center ml-1">
                        <i className={`${isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-gray-400 text-sm`}></i>
                      </div>
                    </div>
                  </div>
                  {isExpanded && h.notes && (
                    <div className="px-4 pb-4 border-t border-white/40">
                      <p className="text-sm text-gray-600 leading-relaxed pt-3">{h.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100"
              style={{ background: 'linear-gradient(135deg, #f0fdf4, #fff7ed)' }}>
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                {editingId ? '✏️ Editar Registro' : '🏥 Novo Registro de Saúde'}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pet *</label>
                <select value={form.petId} onChange={e => setForm({...form, petId: e.target.value})} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer">
                  <option value="">Selecione o pet</option>
                  {pets.map(p => <option key={p.id} value={p.id}>🐾 {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo *</label>
                <div className="grid grid-cols-3 gap-2">
                  {typeOptions.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({...form, type: t.value})}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${form.type === t.value ? 'border-orange-400 bg-orange-50' : 'border-gray-100 hover:border-orange-200 bg-white'}`}
                    >
                      <span>{t.emoji}</span>
                      <span className={`text-xs font-medium ${form.type === t.value ? 'text-orange-600' : 'text-gray-500'}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Peso (kg)</label>
                  <input type="number" step="0.1" min="0" value={form.weight || ''} onChange={e => setForm({...form, weight: parseFloat(e.target.value) || undefined})} placeholder="Ex: 28.5" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Veterinário</label>
                <input type="text" value={form.vet} onChange={e => setForm({...form, vet: e.target.value})} placeholder="Nome do veterinário" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Clínica / Hospital</label>
                <input type="text" value={form.clinic} onChange={e => setForm({...form, clinic: e.target.value})} placeholder="Nome da clínica" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} maxLength={500} placeholder="Diagnóstico, medicamentos, recomendações..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap">
                  {editingId ? 'Salvar' : '🏥 Adicionar registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-xl">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="font-bold text-gray-800 mb-2">Remover registro?</h3>
            <p className="text-gray-400 text-sm mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm cursor-pointer whitespace-nowrap">Cancelar</button>
              <button onClick={() => { deleteHealthRecord(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl text-sm cursor-pointer whitespace-nowrap">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
