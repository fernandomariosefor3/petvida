import { createContext, useContext, ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth/AuthContext';
import { DataProvider, useData } from '@/contexts/data/DataContext';
import { isPlanActive, getCurrentPlan, canAddPet } from '@/lib/plans';

const AppContext = createContext<ReturnType<typeof useAppValue> | null>(null);

function useAppValue() {
  const auth = useAuth();
  const data = useData();
  
  const planActive = auth.currentUser
    ? isPlanActive(auth.currentUser.plan, auth.currentUser.planExpiresAt)
    : false;
  
  const currentPlan = planActive ? getCurrentPlan('premium') : getCurrentPlan('free');
  const canAdd = auth.currentUser ? canAddPet(data.pets.length, auth.currentUser.plan) : false;
  
  return {
    ...auth,
    ...data,
    isPremium: planActive,
    currentPlan,
    canAddPet: canAdd,
    canUploadPhoto: currentPlan.limits.photoUpload,
    canExportData: currentPlan.limits.exportData,
    maxPets: currentPlan.limits.maxPets,
  };
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

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
