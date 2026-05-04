import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const ADMIN_EMAIL = 'fernandomariodasmartins@gmail.com';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  plan: string;
  planExpiresAt: string;
  createdAt: { seconds: number } | null;
  phone?: string;
}

type FilterType = 'all' | 'free' | 'premium';

const PawBg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <ellipse cx="6" cy="7" rx="2" ry="2.5"/>
    <ellipse cx="11" cy="5" rx="2" ry="2.5"/>
    <ellipse cx="16" cy="7" rx="2" ry="2.5"/>
    <ellipse cx="18.5" cy="12" rx="1.5" ry="2"/>
    <path d="M12 10c-3.5 0-7 2.5-7 6 0 2.5 2 4 4 4h6c2 0 4-1.5 4-4 0-3.5-3.5-6-7-6z"/>
  </svg>
);

export default function AdminPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Modal novo cliente
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', email: '', password: '', months: '12' });
  const [creating, setCreating] = useState(false);
  const [newError, setNewError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.email !== ADMIN_EMAIL) navigate('/dashboard');
  }, [currentUser, navigate]);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserRecord)));
    } catch { showToast('Erro ao carregar usuários.', 'error'); }
    finally { setLoading(false); }
  }

  async function createPremiumClient() {
    setCreating(true);
    setNewError('');
    try {
      if (!newForm.name || !newForm.email || !newForm.password) {
        setNewError('Preencha todos os campos obrigatórios.');
        setCreating(false);
        return;
      }
      if (newForm.password.length < 6) {
        setNewError('A senha deve ter pelo menos 6 caracteres.');
        setCreating(false);
        return;
      }

      // Cria usuário no Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, newForm.email, newForm.password);

      // Define expiração premium
      const expires = new Date();
      expires.setMonth(expires.getMonth() + parseInt(newForm.months));
      const planExpiresAt = expires.toISOString().split('T')[0];

      // Salva no Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: newForm.name,
        email: newForm.email,
        phone: '',
        plan: 'premium',
        planExpiresAt,
        createdAt: serverTimestamp(),
      });

      showToast(`✨ ${newForm.name} cadastrado como Premium até ${formatDate(planExpiresAt)}!`, 'success');
      setShowNewModal(false);
      setNewForm({ name: '', email: '', password: '', months: '12' });
      await fetchUsers();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-in-use') setNewError('Este e-mail já está cadastrado.');
      else if (code === 'auth/invalid-email') setNewError('E-mail inválido.');
      else setNewError('Erro ao criar usuário. Tente novamente.');
    } finally { setCreating(false); }
  }

  async function togglePremium(user: UserRecord) {
    setUpdating(user.id);
    try {
      const isCurrentlyPremium = isPremiumActive(user);
      const ref = doc(db, 'users', user.id);
      if (isCurrentlyPremium) {
        await updateDoc(ref, { plan: 'free', planExpiresAt: '' });
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan: 'free', planExpiresAt: '' } : u));
        showToast(`${user.name} voltou para o plano Grátis.`, 'success');
      } else {
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        const expiresAt = expires.toISOString().split('T')[0];
        await updateDoc(ref, { plan: 'premium', planExpiresAt: expiresAt });
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan: 'premium', planExpiresAt: expiresAt } : u));
        showToast(`${user.name} ativado como Premium até ${formatDate(expiresAt)}!`, 'success');
      }
    } catch { showToast('Erro ao atualizar plano.', 'error'); }
    finally { setUpdating(null); }
  }

  async function extendPremium(user: UserRecord, months: number) {
    setUpdating(user.id);
    try {
      const base = isPremiumActive(user) && user.planExpiresAt ? new Date(user.planExpiresAt) : new Date();
      base.setMonth(base.getMonth() + months);
      const expiresAt = base.toISOString().split('T')[0];
      await updateDoc(doc(db, 'users', user.id), { plan: 'premium', planExpiresAt: expiresAt });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan: 'premium', planExpiresAt: expiresAt } : u));
      showToast(`Premium estendido até ${formatDate(expiresAt)}!`, 'success');
    } catch { showToast('Erro ao estender plano.', 'error'); }
    finally { setUpdating(null); }
  }

  function isPremiumActive(user: UserRecord) {
    if (user.plan !== 'premium' || !user.planExpiresAt) return false;
    return new Date(user.planExpiresAt) > new Date();
  }

  function formatDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
  }

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const filtered = users.filter(u => {
    const matchFilter = filter === 'all' || (filter === 'premium' ? isPremiumActive(u) : !isPremiumActive(u));
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalUsers = users.length;
  const totalPremium = users.filter(isPremiumActive).length;
  const totalFree = totalUsers - totalPremium;

  if (currentUser?.email !== ADMIN_EMAIL) return null;

  return (
    <div className="flex-1 min-h-screen" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #f0fdf4 50%, #eff6ff 100%)' }}>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-semibold text-sm transition-all ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
              <i className="ri-shield-star-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Painel Admin</h1>
              <p className="text-sm text-gray-500">Gerencie os planos dos usuários do PetVida</p>
            </div>
          </div>

          {/* BOTÃO NOVO CLIENTE PREMIUM */}
          <button onClick={() => { setShowNewModal(true); setNewError(''); }}
            className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
            <i className="ri-user-add-line"></i> + Novo Cliente Premium
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total usuários', value: totalUsers, emoji: '👥', gradient: 'from-slate-50 to-gray-50', border: 'border-gray-100', text: 'text-gray-800' },
            { label: 'Premium ativos', value: totalPremium, emoji: '👑', gradient: 'from-orange-50 to-amber-50', border: 'border-orange-100', text: 'text-orange-600' },
            { label: 'Plano grátis', value: totalFree, emoji: '🆓', gradient: 'from-emerald-50 to-teal-50', border: 'border-emerald-100', text: 'text-emerald-700' },
          ].map(stat => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-5 border ${stat.border} shadow-sm relative overflow-hidden`}>
              <div className="absolute top-1 right-1 w-8 h-8 opacity-10 pointer-events-none text-orange-400"><PawBg /></div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{stat.emoji} {stat.label}</p>
              <p className={`text-3xl font-black ${stat.text}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input type="text" placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-orange-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 shadow-sm" />
          </div>
          <div className="flex gap-2">
            {(['all', 'premium', 'free'] as FilterType[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer whitespace-nowrap ${filter === f ? 'bg-orange-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                {f === 'all' ? 'Todos' : f === 'premium' ? '★ Premium' : 'Grátis'}
              </button>
            ))}
          </div>
          <button onClick={fetchUsers}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:border-orange-300 transition cursor-pointer flex items-center gap-2 shadow-sm">
            <i className="ri-refresh-line"></i> Atualizar
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <span className="text-4xl animate-bounce">🐾</span>
              <p className="text-sm">Carregando usuários...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <span className="text-5xl">👤</span>
              <p className="font-semibold">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #fff7ed, #f0fdf4)' }}>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Usuário</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Plano</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Expira em</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Cadastro</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => {
                  const premium = isPremiumActive(user);
                  const isUpdating = updating === user.id;
                  return (
                    <tr key={user.id} className={`border-b border-gray-50 transition hover:bg-orange-50/30 ${i % 2 === 0 ? '' : 'bg-gray-50/20'}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm ${premium ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {user.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{user.name || '—'}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${premium ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                          {premium ? '👑 PREMIUM' : '🆓 GRÁTIS'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {premium ? <span className="font-medium text-emerald-600">{formatDate(user.planExpiresAt)}</span> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {premium && (
                            <>
                              <button onClick={() => extendPremium(user, 1)} disabled={isUpdating}
                                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-semibold hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50 border border-emerald-100">
                                +1 mês
                              </button>
                              <button onClick={() => extendPremium(user, 12)} disabled={isUpdating}
                                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-semibold hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50 border border-emerald-100">
                                +1 ano
                              </button>
                            </>
                          )}
                          <button onClick={() => togglePremium(user)} disabled={isUpdating}
                            className={`text-xs px-4 py-1.5 rounded-lg font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${premium ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'}`}>
                            {isUpdating ? <i className="ri-loader-4-line animate-spin"></i>
                              : premium ? <><i className="ri-close-line"></i> Remover</>
                              : <><i className="ri-vip-crown-line"></i> Ativar Premium</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          {filtered.length} de {totalUsers} usuários · Painel restrito ao administrador
        </p>
      </div>

      {/* Modal Novo Cliente Premium */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            {/* Header do modal */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)' }}>
              <div>
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  👑 Novo Cliente Premium
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Cadastre um novo usuário já com plano Premium ativo</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {newError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <i className="ri-error-warning-line text-red-500 text-sm"></i>
                  <p className="text-red-600 text-sm">{newError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo *</label>
                <div className="relative">
                  <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input type="text" value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})}
                    placeholder="Nome do cliente" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail *</label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input type="email" value={newForm.email} onChange={e => setNewForm({...newForm, email: e.target.value})}
                    placeholder="email@cliente.com" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha inicial *</label>
                <div className="relative">
                  <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input type="text" value={newForm.password} onChange={e => setNewForm({...newForm, password: e.target.value})}
                    placeholder="Mínimo 6 caracteres" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400" />
                </div>
                <p className="text-xs text-gray-400 mt-1">O cliente poderá alterar a senha depois no login.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duração do Premium</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: '1', label: '1 mês' },
                    { value: '3', label: '3 meses' },
                    { value: '6', label: '6 meses' },
                    { value: '12', label: '1 ano' },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setNewForm({...newForm, months: opt.value})}
                      className={`py-2 rounded-xl text-xs font-semibold border-2 transition cursor-pointer ${newForm.months === opt.value ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500 hover:border-orange-200'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Premium ativo até: <span className="font-semibold text-emerald-600">
                    {(() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + parseInt(newForm.months));
                      return d.toLocaleDateString('pt-BR');
                    })()}
                  </span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNewModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                  Cancelar
                </button>
                <button onClick={createPremiumClient} disabled={creating}
                  className="flex-1 py-2.5 text-white font-bold rounded-xl text-sm cursor-pointer whitespace-nowrap disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
                  {creating ? <><i className="ri-loader-4-line animate-spin"></i> Criando...</> : <>👑 Criar Cliente Premium</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
