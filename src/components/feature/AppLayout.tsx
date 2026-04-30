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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <i className="ri-heart-2-line text-emerald-500 text-xl"></i>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <i className="ri-loader-4-line animate-spin"></i>
            Carregando...
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />
      <Outlet />
    </div>
  );
}
