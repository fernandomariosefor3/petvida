import { createContext, useContext, useState, ReactNode } from 'react';
import { compressImageToDataUrl } from '@/lib/imageCompress';
import { GuestPet, getGuestPet, saveGuestPet, clearGuestPet } from '@/lib/guestPet';

interface CreateGuestPetInput {
  name: string;
  species: string;
  breed: string;
  photoFile?: File;
}

interface GuestContextType {
  guestPet: GuestPet | null;
  createGuestPet: (input: CreateGuestPetInput) => Promise<void>;
  clearGuestPetState: () => void;
}

const GuestContext = createContext<GuestContextType | null>(null);

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guestPet, setGuestPet] = useState<GuestPet | null>(() => getGuestPet());

  const createGuestPet = async ({ name, species, breed, photoFile }: CreateGuestPetInput) => {
    const photoDataUrl = photoFile ? await compressImageToDataUrl(photoFile) : undefined;
    const pet: GuestPet = { name, species, breed, photoDataUrl, createdAt: new Date().toISOString() };
    saveGuestPet(pet);
    setGuestPet(pet);
  };

  const clearGuestPetState = () => {
    clearGuestPet();
    setGuestPet(null);
  };

  return (
    <GuestContext.Provider value={{ guestPet, createGuestPet, clearGuestPetState }}>
      {children}
    </GuestContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- Provider + hook colocated by design
export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error('useGuest must be used within GuestProvider');
  return ctx;
}
