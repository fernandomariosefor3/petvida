import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const ADMIN_EMAIL = 'fernandomariodasmartins@gmail.com'; // ← seu e-mail

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

export default function AdminPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Proteção — só admin acessa
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.email !== ADMIN_EMAIL) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserRecord));
      setUsers(data);
    } catch (e) {
      showToast('Erro ao carregar usuários.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function togglePremium(user: UserRecord) {
    setUpdating(user.id);
    try {
      const isCurrentlyPremium = isPremiumActive(user);
      const ref = doc(db, 'users', user.id);

      if (isCurrentlyPremium) {
        // Remove premium
        await updateDoc(ref, { plan: 'free', planExpiresAt: '' });
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan: 'free', planExpiresAt: '' } : u));
        showToast(`${user.name} voltou para o plano Grátis.`, 'success');
      } else {
        // Ativa premium por 1 ano
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        const expiresAt = expires.toISOString().split('T')[0];
        await updateDoc(ref, { plan: 'premium', planExpiresAt: expiresAt });
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan: 'premium', planExpiresAt: expiresAt } : u));
        showToast(`${user.name} ativado como Premium até ${formatDate(expiresAt)}!`, 'success');
      }
    } catch {
      showToast('Erro ao atualizar plano.', 'error');
    } finally {
      setUpdating(null);
    }
  }

  async function extendPremium(user: UserRecord, months: number) {
    setUpdating(user.id);
    try {
      const base = isPremiumActive(user) && user.planExpiresAt
        ? new Date(user.planExpiresAt)
        : new Date();
      base.setMonth(base.getMonth() + months);
      const expiresAt = base.toISOString().split('T')[0];
      await updateDoc(doc(db, 'users', user.id), { plan: 'premium', planExpiresAt: expiresAt });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan: 'premium', planExpiresAt: expiresAt } : u));
      showToast(`Premium estendido até ${formatDate(expiresAt)}!`, 'success');
    } catch {
      showToast('Erro ao estender plano.', 'error');
    } finally {
      setUpdating(null);
    }
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
    setTimeout(() => setToast(null), 3500);
  }

  const filtered = users.filter(u => {
    const matchFilter = filter === 'all' || (filter === 'premium' ? isPremiumActive(u) : !isPremiumActive(u));
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalUsers = users.length;
  const totalPremium = users.filter(isPremiumActive).length;
  const totalFree = totalUsers - totalPremium;

  if (currentUser?.email !== ADMIN_EMAIL) return null;

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-semibold text-sm transition-all ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
            <i className="ri-shield-star-line text-orange-500 text-lg"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Painel Admin</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">Gerencie os planos dos usuários do PetVida</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total usuários</p>
          <p className="text-3xl font-black text-gray-800">{totalUsers}</p>
        </div>
        <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 shadow-sm">
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1">Premium ativos</p>
          <p className="text-3xl font-black text-orange-600">{totalPremium}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Plano grátis</p>
          <p className="text-3xl font-black text-gray-600">{totalFree}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'premium', 'free'] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                filter === f
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
              }`}>
              {f === 'all' ? 'Todos' : f === 'premium' ? '★ Premium' : 'Grátis'}
            </button>
          ))}
        </div>
        <button onClick={fetchUsers}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:border-orange-300 transition cursor-pointer flex items-center gap-2">
          <i className="ri-refresh-line"></i> Atualizar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <i className="ri-loader-4-line animate-spin text-2xl mr-3"></i>
            Carregando usuários...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <i className="ri-user-search-line text-4xl mb-3"></i>
            <p className="font-semibold">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
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
                  <tr key={user.id} className={`border-b border-gray-50 transition hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          premium ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {user.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{user.name || '—'}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                        premium
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {premium ? '★ PREMIUM' : 'GRÁTIS'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {premium ? (
                        <span className="font-medium text-emerald-600">{formatDate(user.planExpiresAt)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">
                      {user.createdAt?.seconds
                        ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {premium && (
                          <>
                            <button onClick={() => extendPremium(user, 1)} disabled={isUpdating}
                              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-semibold hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50">
                              +1 mês
                            </button>
                            <button onClick={() => extendPremium(user, 12)} disabled={isUpdating}
                              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-semibold hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50">
                              +1 ano
                            </button>
                          </>
                        )}
                        <button onClick={() => togglePremium(user)} disabled={isUpdating}
                          className={`text-xs px-4 py-1.5 rounded-lg font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                            premium
                              ? 'bg-red-50 text-red-500 hover:bg-red-100'
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}>
                          {isUpdating ? (
                            <i className="ri-loader-4-line animate-spin"></i>
                          ) : premium ? (
                            <><i className="ri-close-line"></i> Remover</>
                          ) : (
                            <><i className="ri-vip-crown-line"></i> Ativar Premium</>
                          )}
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
  );
}
