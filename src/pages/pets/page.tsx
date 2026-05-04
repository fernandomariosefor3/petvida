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

const speciesEmoji: Record<string, string> = {
  'Cão': '🐶', 'Gato': '🐱', 'Pássaro': '🐦', 'Coelho': '🐰',
  'Hamster': '🐹', 'Peixe': '🐟', 'Réptil': '🦎', 'Outro': '🐾',
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

const cardGradients = [
  'from-orange-50 to-amber-50 border-orange-100',
  'from-emerald-50 to-teal-50 border-emerald-100',
  'from-violet-50 to-indigo-50 border-violet-100',
  'from-rose-50 to-pink-50 border-rose-100',
  'from-sky-50 to-blue-50 border-sky-100',
];

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

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="flex-1 overflow-y-auto" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #f0fdf4 50%, #eff6ff 100%)' }}>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🐾 Meus Pets
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {pets.length}{!isPremium ? `/${planLimits.maxPets}` : ''} pet{pets.length !== 1 ? 's' : ''} cadastrado{pets.length !== 1 ? 's' : ''}
              {!isPremium && <span className="text-orange-500 ml-1">(plano grátis)</span>}
            </p>
          </div>
          <button onClick={openAdd}
            className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap shadow-sm ${
              canAddPet ? 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-md' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <i className={canAddPet ? 'ri-add-line' : 'ri-lock-line'}></i>
            {canAddPet ? '+ Novo Pet' : 'Limite atingido'}
          </button>
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

        {/* Empty */}
        {pets.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-orange-100 text-center relative overflow-hidden shadow-sm">
            <div className="absolute bottom-0 right-0 w-40 h-40 opacity-5 pointer-events-none text-orange-400"><PawBg /></div>
            <div className="text-7xl mb-4">🐶🐱</div>
            <h3 className="font-bold text-gray-800 mb-2 text-lg">Nenhum pet cadastrado</h3>
            <p className="text-gray-400 text-sm mb-6">Adicione seu primeiro pet e comece a organizar os cuidados com amor! 💕</p>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl text-sm cursor-pointer whitespace-nowrap hover:bg-orange-600 transition-colors shadow-sm">
              <i className="ri-add-line"></i> Adicionar primeiro pet
            </button>
          </div>
        )}

        {/* Pet Cards */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((pet, idx) => {
              const gradClass = cardGradients[idx % cardGradients.length];
              const emoji = speciesEmoji[pet.species] || '🐾';
              return (
                <div key={pet.id} className={`bg-gradient-to-br ${gradClass} rounded-2xl border overflow-hidden group shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="relative h-44 overflow-hidden">
                    {pet.photo ? (
                      <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center relative"
                        style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(52,211,153,0.15) 100%)' }}>
                        {/* Paw pattern background */}
                        <div className="absolute inset-0 grid grid-cols-4 gap-4 p-4 opacity-10 pointer-events-none">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className={`text-orange-400 ${i % 3 === 0 ? 'rotate-12' : i % 3 === 1 ? '-rotate-12' : 'rotate-0'}`}>
                              <PawBg />
                            </div>
                          ))}
                        </div>
                        <span className="text-6xl z-10">{emoji}</span>
                        <p className="text-xs text-gray-400 mt-2 z-10 font-medium">Sem foto</p>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button onClick={() => openEdit(pet)} className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-gray-600 hover:text-orange-600 transition-colors cursor-pointer shadow-sm"><i className="ri-edit-line text-sm"></i></button>
                      <button onClick={() => setDeleteConfirm(pet.id)} className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-gray-600 hover:text-rose-500 transition-colors cursor-pointer shadow-sm"><i className="ri-delete-bin-line text-sm"></i></button>
                    </div>
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">{pet.gender === 'male' ? '♂ Macho' : '♀ Fêmea'}</span>
                      {pet.neutered && <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">Castrado</span>}
                    </div>
                  </div>
                  <div className="p-4 bg-white/70 backdrop-blur-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">{emoji} {pet.name}</h3>
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
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">🔍</div>
            <p>Nenhum pet encontrado para &ldquo;{search}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100"
              style={{ background: 'linear-gradient(135deg, #fff7ed, #f0fdf4)' }}>
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                {editingId ? '✏️ Editar Pet' : '🐾 Novo Pet'}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto do pet {!canUploadPhoto && <span className="text-orange-500 text-xs">(Premium)</span>}</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-orange-50 flex items-center justify-center flex-shrink-0 border border-orange-100">
                    {form.photo
                      ? <img src={form.photo} alt="Pet" className="w-full h-full object-cover" />
                      : <span className="text-3xl">{speciesEmoji[form.species] || '🐾'}</span>
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
                <button type="submit" className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap">{editingId ? 'Salvar alterações' : '🐾 Adicionar pet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-5xl text-center mb-4">😢</div>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-xl">
            <div className="text-5xl mb-4">👑</div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Recurso Premium</h3>
            <p className="text-gray-500 text-sm mb-6">Este recurso está disponível apenas no plano Premium. Faça upgrade por apenas R$29,99/ano!</p>
            <div className="flex gap-3">
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 cursor-pointer whitespace-nowrap">Depois</button>
              <button onClick={() => { setShowUpgradeModal(false); navigate('/planos'); }} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap">Ver planos</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
