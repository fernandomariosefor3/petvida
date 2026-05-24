import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Pet } from '@/types';

type PetFormData = Omit<Pet, 'id' | 'userId' | 'createdAt'>;
const speciesOptions = ['Cão', 'Gato', 'Pássaro', 'Coelho', 'Hamster', 'Peixe', 'Réptil', 'Outro'];
const genderOptions: { value: 'male' | 'female'; label: string }[] = [
  { value: 'male', label: 'Macho' }, { value: 'female', label: 'Fêmea' },
];
const defaultForm: PetFormData = {
  name: '', species: 'Cão', breed: '', birthDate: '', weight: 0,
  color: '', gender: 'male', photo: '', microchip: '', neutered: false,
  bloodType: '', allergies: '', notes: '',
};

const cardGradients = [
  'from-orange-50 to-amber-50 border-orange-100',
  'from-emerald-50 to-teal-50 border-emerald-100',
  'from-violet-50 to-indigo-50 border-violet-100',
  'from-rose-50 to-pink-50 border-rose-100',
  'from-sky-50 to-blue-50 border-sky-100',
];

const speciesPlaceholder: Record<string, string> = {
  'Cão': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=200&fit=crop&crop=center',
  'Gato': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=200&fit=crop&crop=center',
  'Pássaro': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&h=200&fit=crop&crop=center',
  'Coelho': 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=200&fit=crop&crop=center',
  'Peixe': 'https://images.unsplash.com/photo-1497206365907-f5e630693df0?w=400&h=200&fit=crop&crop=center',
  'Hamster': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=200&fit=crop&crop=center',
  'Réptil': 'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=400&h=200&fit=crop&crop=center',
  'Outro': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=200&fit=crop&crop=center',
};

export default function PetsPage() {
  const { currentUser, pets, addPet, updatePet, deletePet, uploadPhoto, canAddPet, canUploadPhoto, isPremium, planLimits } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PetFormData>(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const filtered = pets.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.breed.toLowerCase().includes(search.toLowerCase()) ||
    p.species.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    if (!canAddPet) { setShowUpgradeModal(true); return; }
    setForm(defaultForm); setEditingId(null); setShowForm(true);
  };

  const openEdit = (pet: Pet) => {
    setForm({ name: pet.name, species: pet.species, breed: pet.breed, birthDate: pet.birthDate, weight: pet.weight, color: pet.color, gender: pet.gender, photo: pet.photo, notes: pet.notes, microchip: pet.microchip, neutered: pet.neutered, bloodType: pet.bloodType, allergies: pet.allergies });
    setEditingId(pet.id); setShowForm(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadPhoto) { setShowUpgradeModal(true); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `pets/${currentUser.id}/${Date.now()}_${file.name}`;
      const url = await uploadPhoto(file, path);
      setForm({ ...form, photo: url });
    } catch (err) { console.error('Erro ao enviar foto:', err); }
    setUploading(false);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingId) { await updatePet(editingId, form); }
    else { await addPet(form); }
    setShowForm(false); setEditingId(null);
  };

  const handleDelete = (id: string) => { deletePet(id); setDeleteConfirm(null); };

  const getAge = (birthDate: string) => {
    if (!birthDate) return '—';
    const bd = new Date(birthDate); const now = new Date();
    const months = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth());
    if (months < 1) return '< 1 mês';
    if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-5xl mx-auto">

        {/* Header com foto */}
        <div className="relative rounded-2xl overflow-hidden h-36 mb-6">
          <img
            src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&h=200&fit=crop&crop=center"
            alt="Meus Pets"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-between px-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Meus Pets</h1>
              <p className="text-white/70 text-sm mt-0.5">
                {pets.length}{!isPremium ? `/${planLimits.maxPets}` : ''} pet{pets.length !== 1 ? 's' : ''} cadastrado{pets.length !== 1 ? 's' : ''}
                {!isPremium && <span className="text-orange-300 ml-1">(plano grátis)</span>}
              </p>
            </div>
            <button onClick={openAdd}
              className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap shadow-lg ${
                canAddPet ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white/20 text-white/50 cursor-not-allowed'
              }`}
            >
              <i className={canAddPet ? 'ri-add-line' : 'ri-lock-line'}></i>
              {canAddPet ? '+ Novo Pet' : 'Limite atingido'}
            </button>
          </div>
        </div>

        {/* Limit warning */}
        {!isPremium && pets.length >= planLimits.maxPets && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="ri-vip-crown-line text-orange-500 text-lg"></i>
              <div>
                <p className="text-sm font-semibold text-gray-800">Você atingiu o limite de {planLimits.maxPets} pets</p>
                <p className="text-xs text-gray-500">Faça upgrade para Premium e cadastre pets ilimitados</p>
              </div>
            </div>
            <button onClick={() => navigate('/planos')} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap">
              Ver planos
            </button>
          </div>
        )}

        {/* Search */}
        {pets.length > 0 && (
          <div className="relative mb-6">
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><i className="ri-search-line text-gray-400 text-sm"></i></div>
            <input type="text" placeholder="Buscar por nome, raça ou espécie..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-orange-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 shadow-sm" />
          </div>
        )}

        {/* Empty state com foto real */}
        {pets.length === 0 && (
          <div className="bg-white rounded-2xl overflow-hidden border border-orange-100 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&h=280&fit=crop&crop=center"
              alt="Adicione seu primeiro pet"
              className="w-full h-56 object-cover"
            />
            <div className="p-8 text-center">
              <h3 className="font-bold text-gray-800 mb-2 text-lg">Nenhum pet cadastrado</h3>
              <p className="text-gray-400 text-sm mb-6">Adicione seu primeiro pet e comece a organizar os cuidados.</p>
              <button onClick={openAdd} className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl text-sm cursor-pointer whitespace-nowrap hover:bg-orange-600 transition-colors shadow-sm">
                <i className="ri-add-line"></i> Adicionar primeiro pet
              </button>
            </div>
          </div>
        )}

        {/* Pet Cards com foto real por espécie */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((pet, idx) => {
              const gradClass = cardGradients[idx % cardGradients.length];
              const placeholder = speciesPlaceholder[pet.species] || speciesPlaceholder['Outro'];
              return (
                <div key={pet.id} className={`bg-gradient-to-br ${gradClass} rounded-2xl border overflow-hidden group shadow-sm hover:shadow-lg transition-all`}>
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={pet.photo || placeholder}
                      alt={pet.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button onClick={() => openEdit(pet)} className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-gray-600 hover:text-orange-600 transition-colors cursor-pointer shadow-sm"><i className="ri-edit-line text-sm"></i></button>
                      <button onClick={() => setDeleteConfirm(pet.id)} className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-gray-600 hover:text-rose-500 transition-colors cursor-pointer shadow-sm"><i className="ri-delete-bin-line text-sm"></i></button>
                    </div>
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">{pet.gender === 'male' ? 'Macho' : 'Fêmea'}</span>
                      {pet.neutered && <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">Castrado</span>}
                    </div>
                  </div>
                  <div className="p-4 bg-white/70 backdrop-blur-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">{pet.name}</h3>
                        <p className="text-sm text-gray-500">{pet.breed || pet.species}</p>
                      </div>
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap border border-emerald-100">{pet.species}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ label: 'Idade', value: getAge(pet.birthDate) }, { label: 'Peso', value: pet.weight ? `${pet.weight} kg` : '—' }, { label: 'Cor', value: pet.color || '—' }].map(item => (
                        <div key={item.label} className="bg-white/80 rounded-xl p-2 text-center border border-white">
                          <p className="text-xs text-gray-400">{item.label}</p>
                          <p className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {pet.allergies && (
                      <div className="flex items-center gap-1.5 mt-3 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-100">
                        <i className="ri-alert-line text-amber-500 text-xs"></i>
                        <p className="text-xs text-amber-700 truncate">Alergias: {pet.allergies}</p>
                      </div>
                    )}
                    <Link to={`/pets/${pet.id}`} className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border border-orange-100">
                      Ver detalhes <i className="ri-arrow-right-line text-xs"></i>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && pets.length > 0 && (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center shadow-sm">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="ri-search-line text-gray-300 text-xl"></i>
            </div>
            <p className="text-gray-400 text-sm">Nenhum pet encontrado para &ldquo;{search}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100"
              style={{ background: 'linear-gradient(135deg, #fff7ed, #f0fdf4)' }}>
              <h2 className="font-bold text-gray-800 text-lg">
                {editingId ? 'Editar Pet' : 'Novo Pet'}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto do pet {!canUploadPhoto && <span className="text-orange-500 text-xs">(Premium)</span>}</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-orange-50 flex items-center justify-center flex-shrink-0 border border-orange-100">
                    {form.photo
                      ? <img src={form.photo} alt="Pet" className="w-full h-full object-cover" />
                      : <img src={speciesPlaceholder[form.species] || speciesPlaceholder['Outro']} alt="Pet" className="w-full h-full object-cover opacity-60" />
                    }
                  </div>
                  <div className="flex-1">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <button type="button" onClick={() => canUploadPhoto ? fileInputRef.current?.click() : setShowUpgradeModal(true)} disabled={uploading}
                      className={`text-sm font-medium cursor-pointer disabled:opacity-50 ${canUploadPhoto ? 'text-orange-600 hover:text-orange-700' : 'text-gray-400'}`}>
                      {uploading ? <span className="flex items-center gap-1"><i className="ri-loader-4-line animate-spin"></i> Enviando...</span>
                        : canUploadPhoto ? 'Enviar foto' : <span><i className="ri-lock-line mr-1"></i>Premium</span>}
                    </button>
                    <p className="text-xs text-gray-400 mt-1">ou cole uma URL abaixo</p>
                    <input type="url" value={form.photo} onChange={e => setForm({...form, photo: e.target.value})} placeholder="https://..." className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-200" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do pet *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Ex: Thor, Luna..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Espécie *</label><select value={form.species} onChange={e => setForm({...form, species: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer">{speciesOptions.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Sexo</label><select value={form.gender} onChange={e => setForm({...form, gender: e.target.value as 'male' | 'female'})} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer">{genderOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Raça</label><input type="text" value={form.breed} onChange={e => setForm({...form, breed: e.target.value})} placeholder="Ex: Golden Retriever" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Data de nascimento</label><input type="date" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Peso (kg)</label><input type="number" step="0.1" min="0" value={form.weight || ''} onChange={e => setForm({...form, weight: parseFloat(e.target.value) || 0})} placeholder="0.0" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Pelagem / Cor</label><input type="text" value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="Ex: Dourado" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Microchip</label><input type="text" value={form.microchip} onChange={e => setForm({...form, microchip: e.target.value})} placeholder="Nº do microchip" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo sanguíneo</label><input type="text" value={form.bloodType} onChange={e => setForm({...form, bloodType: e.target.value})} placeholder="Ex: DEA 1.1+" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" /></div>
                <div className="col-span-2 flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={form.neutered} onChange={e => setForm({...form, neutered: e.target.checked})} className="sr-only peer" /><div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-orange-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div></label>
                  <span className="text-sm text-gray-700">Castrado/Esterilizado</span>
                </div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1.5">Alergias</label><input type="text" value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} placeholder="Ex: Frango, pólen..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} maxLength={500} placeholder="Informações extras..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap">{editingId ? 'Salvar alterações' : 'Adicionar pet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-delete-bin-line text-rose-500 text-xl"></i>
            </div>
            <h3 className="font-bold text-gray-800 text-center mb-2">Remover pet?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">Todos os lembretes e registros de saúde deste pet também serão removidos.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap">Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm text-center shadow-xl overflow-hidden">
            <img src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=140&fit=crop" alt="Premium" className="w-full h-32 object-cover" />
            <div className="p-6">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 -mt-10 border-2 border-white shadow-sm">
                <i className="ri-vip-crown-line text-orange-500 text-xl"></i>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">Recurso Premium</h3>
              <p className="text-gray-500 text-sm mb-6">Disponível no plano Premium por apenas R$29,99/ano.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowUpgradeModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 cursor-pointer whitespace-nowrap">Depois</button>
                <button onClick={() => { setShowUpgradeModal(false); navigate('/planos'); }} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap">Ver planos</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
