import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'ri-layout-grid-line' },
  { path: '/pets', label: 'Meus Pets', icon: 'ri-heart-2-line' },
  { path: '/reminders', label: 'Lembretes', icon: 'ri-alarm-line' },
  { path: '/health', label: 'Saúde', icon: 'ri-heart-pulse-line' },
  { path: '/services', label: 'Serviços 24h', icon: 'ri-first-aid-kit-line' },
  { path: '/planos', label: 'Planos', icon: 'ri-vip-crown-line' },
];

export default function AppSidebar() {
  const { currentUser, logout, pets, reminders, isPro, isFree, isAdmin } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const visibleItems = [
    ...navItems,
    ...(!isFree ? [{ path: '/billing', label: 'Assinatura', icon: 'ri-bank-card-line' }] : []),
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: 'ri-shield-star-line' }] : []),
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = reminders.filter(r => !r.completed && new Date(r.date) < today).length;
  const pendingCount = reminders.filter(r => !r.completed && new Date(r.date) >= today).length;

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} min-h-screen flex flex-col transition-all duration-300 flex-shrink-0 bg-white border-r border-gray-100`}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
          <img src="/logo.png" alt="PetVida" className="w-9 h-9 object-contain rounded-lg" />
        </div>
        {!collapsed && <span className="font-bold text-gray-800 text-base tracking-tight">PetVida</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 cursor-pointer">
          <i className={`${collapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'} text-sm`}></i>
        </button>
      </div>

      {/* User info */}
      {!collapsed && currentUser && (
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-orange-500">
              <span className="text-white font-semibold text-sm">{currentUser.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                isAdmin ? 'bg-purple-100 text-purple-600'
                : isPro ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-500'
              }`}>
                {isAdmin ? 'Admin' : isPro ? 'Pro' : 'Grátis'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
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
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
                <i className={`${item.icon} text-base`}></i>
                {collapsed && (showOverdueBadge || showPendingBadge) && (
                  <span className={`absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-white text-[9px] font-bold px-0.5 ${showOverdueBadge ? 'bg-rose-500' : 'bg-orange-400'}`}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && (showOverdueBadge || showPendingBadge) && (
                <span className={`text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center flex-shrink-0 px-1 font-semibold ${showOverdueBadge ? 'bg-rose-500' : 'bg-orange-400'}`}>
                  {badgeCount}
                </span>
              )}
              {!collapsed && isPlanos && !isPro && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">UP</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Upgrade banner for free users */}
      {!collapsed && !isPro && !isAdmin && (
        <div className="mx-3 mb-3 px-4 py-3 rounded-xl bg-orange-500 cursor-pointer hover:bg-orange-600 transition-colors"
          onClick={() => navigate('/planos')}>
          <div className="flex items-center gap-2 mb-0.5">
            <i className="ri-vip-crown-line text-white text-sm"></i>
            <p className="text-xs text-white font-bold">Seja Pro</p>
          </div>
          <p className="text-[10px] text-orange-100 leading-tight">Export em PDF por R$14,99/ano</p>
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
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <Link to="/settings/notifications" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all cursor-pointer w-full whitespace-nowrap">
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"><i className="ri-notification-3-line text-base"></i></div>
          {!collapsed && <span>Notificações</span>}
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer w-full whitespace-nowrap">
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"><i className="ri-logout-box-line text-base"></i></div>
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
