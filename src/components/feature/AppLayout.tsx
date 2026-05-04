import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useApp } from '@/contexts/AppContext';

const PawBg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <ellipse cx="6" cy="7" rx="2" ry="2.5"/>
    <ellipse cx="11" cy="5" rx="2" ry="2.5"/>
    <ellipse cx="16" cy="7" rx="2" ry="2.5"/>
    <ellipse cx="18.5" cy="12" rx="1.5" ry="2"/>
    <path d="M12 10c-3.5 0-7 2.5-7 6 0 2.5 2 4 4 4h6c2 0 4-1.5 4-4 0-3.5-3.5-6-7-6z"/>
  </svg>
);

export default function AppLayout() {
  const { firebaseUser, loading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      navigate('/register');
    }
  }, [firebaseUser, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #f0fdf4 50%, #eff6ff 100%)' }}>
        {/* Decorative paws */}
        <div className="absolute top-10 left-10 w-16 h-16 text-orange-200 opacity-50 rotate-12 pointer-events-none"><PawBg /></div>
        <div className="absolute top-32 right-20 w-10 h-10 text-emerald-200 opacity-50 -rotate-12 pointer-events-none"><PawBg /></div>
        <div className="absolute bottom-20 left-24 w-12 h-12 text-amber-200 opacity-50 rotate-45 pointer-events-none"><PawBg /></div>
        <div className="absolute bottom-10 right-10 w-14 h-14 text-orange-200 opacity-50 -rotate-6 pointer-events-none"><PawBg /></div>
        <div className="absolute top-1/2 left-8 w-8 h-8 text-emerald-200 opacity-40 rotate-20 pointer-events-none"><PawBg /></div>

        <div className="flex flex-col items-center gap-5">
          {/* Animated logo area */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
              <span className="text-4xl animate-bounce">🐾</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-400 rounded-full flex items-center justify-center shadow-sm">
              <i className="ri-loader-4-line animate-spin text-white text-sm"></i>
            </div>
          </div>

          <div className="text-center">
            <p className="font-bold text-orange-600 text-lg">PetVida</p>
            <p className="text-gray-400 text-sm mt-1">Carregando seus pets... 🐶🐱</p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-orange-300 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return null;

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #f0fdf4 50%, #eff6ff 100%)' }}>
      <AppSidebar />
      <Outlet />
    </div>
  );
}
