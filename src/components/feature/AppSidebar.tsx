import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

const ADMIN_EMAIL = 'fernandomariodasmartins@gmail.com';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'ri-layout-grid-line' },
  { path: '/pets', label: 'Meus Pets', icon: 'ri-heart-2-line' },
  { path: '/reminders', label: 'Lembretes', icon: 'ri-alarm-line' },
  { path: '/health', label: 'Saúde', icon: 'ri-heart-pulse-line' },
  { path: '/planos', label: 'Planos', icon: 'ri-vip-crown-line' },
];

export default function AppSidebar() {
  const { currentUser, logout, pets, reminders, isPremium } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const visibleItems = isAdmin
    ? [...navItems, { path: '/admin', label: 'Admin', icon: 'ri-shield-star-line' }]
    : navItems;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = reminders.filter(r => !r.completed && new Date(r.date) < today).length;
  const pendingCount = reminders.filter(r => !r.completed && new Date(r.date) >= today).length;

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} min-h-screen bg-white border-r border-gray-100 flex flex-col transition-all duration-300 flex-shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
          <img src="/logo.png" alt="PetVida" className="w-12 h-12 object-contain rounded-xl" />
        </div>
        {!collapsed && <span className="font-bold text-gray-800 text-lg tracking-tight">PetVida</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 cursor-pointer">
          <i className={`${collapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'} text-sm`}></i>
        </button>
      </div>

      {/* User info */}
      {!collapsed && currentUser && (
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span className="text-orange-600 font-semibold text-sm">{currentUser.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isAdmin ? 'bg-purple-100 text-purple-600' : isPremium ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                  {isAdmin ? '⚡ ADMIN' : isPremium ? '★ PREMIUM' : 'GRÁTIS'}
                </span>
                <span className="text-xs text-gray-400">{pets.length} pet{pets.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map(item => {
          const isReminders = item.path === '/reminders';
          const isPlanos = item.path === '/planos';
          const isAdminItem = item.path === '/admin';
          const showOverdueBadge = isReminders && overdueCount > 0;
          const showPendingBadge = isReminders && !showOverdueBadge && pendingCount > 0;
          const badgeCount = showOverdueBadge ? overdueCount : pendingCount;

          return (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? isAdminItem ? 'bg-purple-50 text-purple-600'
                    : isPlanos ? 'bg-orange-50 text-orange-600'
                    : 'bg-emerald-50 text-emerald-600'
                    : isAdminItem ? 'text-purple-500 hover:bg-purple-50'
                    : isPlanos && !isPremium ? 'text-orange-500 hover:bg-orange-50'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
                <i className={`${item.icon} text-base`}></i>
                {collapsed && (showOverdueBadge || showPendingBadge) && (
                  <span className={`absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-white text-[9px] font-bold px-0.5 ${showOverdueBadge ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && (showOverdueBadge || showPendingBadge) && (
                <span className={`text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center flex-shrink-0 px-1 font-semibold ${showOverdueBadge ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                  {badgeCount}
                </span>
              )}
              {!collapsed && isPlanos && !isPremium && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">UP</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Upgrade banner for free users */}
      {!collapsed && !isPremium && !isAdmin && (
        <div className="mx-3 mb-3 px-3 py-3 bg-gradient-to-r from-orange-500 to-orange-400 rounded-xl cursor-pointer" onClick={() => navigate('/planos')}>
          <div className="flex items-center gap-2 mb-1">
            <i className="ri-vip-crown-line text-white text-sm"></i>
            <p className="text-xs text-white font-bold">Seja Premium</p>
          </div>
          <p className="text-[10px] text-orange-100 leading-tight">Pets ilimitados, fotos e muito mais por R$29,99/ano</p>
        </div>
      )}

      {/* Overdue alert */}
      {!collapsed && overdueCount > 0 && (
        <div className="mx-3 mb-3 px-3 py-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2">
          <i className="ri-error-warning-line text-rose-500 text-sm"></i>
          <p className="text-xs text-rose-600 font-medium">{overdueCount} lembrete{overdueCount > 1 ? 's' : ''} atrasado{overdueCount > 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer w-full whitespace-nowrap">
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"><i className="ri-logout-box-line text-base"></i></div>
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
