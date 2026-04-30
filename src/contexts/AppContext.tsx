import { createContext, useContext, ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth/AuthContext';
import { DataProvider, useData } from '@/contexts/data/DataContext';
import { PLAN_LIMITS } from '@/types';

function checkPlanActive(plan: string, expiresAt: string): boolean {
  if (plan === 'free' || !expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

const AppContext = createContext<ReturnType<typeof useAppValue> | null>(null);

function useAppValue() {
  const auth = useAuth();
  const data = useData();
  const isPremium = auth.currentUser
    ? checkPlanActive(auth.currentUser.plan, auth.currentUser.planExpiresAt)
    : false;
  const planLimits = isPremium ? PLAN_LIMITS.premium : PLAN_LIMITS.free;
  const canAddPet = data.pets.length < planLimits.maxPets;
  const canUploadPhoto = planLimits.photoUpload;
  return { ...auth, ...data, isPremium, planLimits, canAddPet, canUploadPhoto };
}

function AppContextBridge({ children }: { children: ReactNode }) {
  const value = useAppValue();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContextBridge>{children}</AppContextBridge>
      </DataProvider>
    </AuthProvider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}