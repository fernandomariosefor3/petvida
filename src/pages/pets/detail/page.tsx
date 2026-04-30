import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Pet } from '@/types';
import PetHeroCard from './components/PetHeroCard';
import PetHealthTab from './components/PetHealthTab';
import PetRemindersTab from './components/PetRemindersTab';

type TabType = 'health' | 'reminders';
type PetFormData = Omit<Pet, 'id' | 'userId' | 'createdAt'>;

const speciesOptions = ['Cão', 'Gato', 'Pássaro', 'Coelho', 'Hamster', 'Peixe', 'Outro'];

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pets, reminders, healthRecords, updatePet, deletePet } = useApp();

  const pet = pets.find(p => p.id === id);

  const [activeTab, setActiveTab] = useState<TabType>('health');
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState<PetFormData | null>(null);

  if (!pet) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-heart-2-line text-gray-300 text-2xl"></i>
          </div>
          <h2 className="font-bold text-gray-800 mb-2">Pet não encontrado</h2>
          <Link to="/pets" className="text-emerald-600 text-sm hover:underline cursor-pointer">
            ← Voltar para Meus Pets
          </Link>
        </div>
      </div>
    );
  }

  const petHealthRecords = healthRecords.filter(h => h.petId === pet.id);
  const petReminders = reminders.filter(r => r.petId === pet.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pendingCount = petReminders.filter(r => !r.completed && new Date(r.date) >= today).length;
  const overdueCount = petReminders.filter(r => !r.completed && new Date(r.date) < today).length;

  const openEdit = () => {
    setForm({
      name: pet.name, species: pet.species, breed: pet.breed,
      birthDate: pet.birthDate, weight: pet.weight, color: pet.color,
      gender: pet.gender, photo: pet.photo, notes: pet.notes,
      microchip: pet.microchip, neutered: pet.neutered,
      bloodType: pet.bloodType, allergies: pet.allergies,
    });
    setShowEdit(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    await updatePet(pet.id, form);
    setShowEdit(false);
  };

  const handleDelete = async () => {
    await deletePet(pet.id);
    navigate('/pets');
  };

  const tabs: { key: TabType; label: string; icon: string; count: number }[] = [
    { key: 'health', label: 'Saúde', icon: 'ri-heart-pulse-line', count: petHealthRecords.length },
    { key: 'reminders', label: 'Lembretes', icon: 'ri-alarm-line', count: petReminders.length },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-5xl mx-auto">
        {/* Back */}
        <Link
          to="/pets"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 cursor-pointer transition-colors"
        >
          <i className="ri-arrow-left-line text-sm"></i> Meus Pets
        </Link>

        {/* Hero */}
        <PetHeroCard
          pet={pet}
          healthCount={petHealthRecords.length}
          pendingCount={pendingCount}
          overdueCount={overdueCount}
          onEdit={openEdit}
          onDelete={() => setShowDeleteConfirm(true)}
        />

        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 border border-gray-100 mt-6 mb-5 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={tab.icon}></i>
              </div>
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'health' && <PetHealthTab petId={pet.id} />}
        {activeTab === 'reminders' && <PetRemindersTab petId={pet.id} petName={pet.name} />}
      </div>

      {/* Edit Modal */}
      {showEdit && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-lg">Editar {pet.name}</h2>
              <button onClick={() => setShowEdit(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do pet *</label>
                  <input type="text" value={form.name} required onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-emerald-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Espécie *</label>
                  <select value={form.species} onChange={e => setForm({ ...form, species: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer">
                    {speciesOptions.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sexo</label>
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer">
                    <option value="male">Macho</option>
                    <option value="female">Fêmea</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Raça</label>
                  <input type="text" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de nascimento</label>
                  <input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Peso (kg)</label>
                  <input type="number" step="0.1" min="0" value={form.weight || ''}
                    onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pelagem / Cor</label>
                  <input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Microchip</label>
                  <input type="text" value={form.microchip || ''} onChange={e => setForm({ ...form, microchip: e.target.value })}
                    placeholder="Nº do microchip"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo sanguíneo</label>
                  <input type="text" value={form.bloodType || ''} onChange={e => setForm({ ...form, bloodType: e.target.value })}
                    placeholder="Ex: DEA 1.1+"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.neutered || false} onChange={e => setForm({ ...form, neutered: e.target.checked })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-sm text-gray-700">Castrado/Esterilizado</span>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Alergias</label>
                  <input type="text" value={form.allergies || ''} onChange={e => setForm({ ...form, allergies: e.target.value })}
                    placeholder="Ex: Frango, pólen..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">URL da foto</label>
                  <input type="url" value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
                  <textarea value={form.notes} rows={2} maxLength={500} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap">Salvar alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-delete-bin-line text-rose-500 text-xl"></i>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Remover {pet.name}?</h3>
            <p className="text-gray-500 text-sm mb-6">Todos os lembretes e registros de saúde deste pet também serão removidos. Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm cursor-pointer whitespace-nowrap">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl text-sm cursor-pointer whitespace-nowrap">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
