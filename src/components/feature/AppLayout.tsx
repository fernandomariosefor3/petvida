import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useApp } from '@/contexts/AppContext';

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img src="/logo.png" alt="PetVida" className="w-16 h-16 rounded-2xl object-contain shadow-sm" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
              <i className="ri-loader-4-line animate-spin text-white text-xs"></i>
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-800 text-base">PetVida</p>
            <p className="text-gray-400 text-sm mt-0.5">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar />
      <Outlet />
    </div>
  );
}
