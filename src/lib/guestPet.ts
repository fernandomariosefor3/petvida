const GUEST_PET_KEY = 'petvida_guest_pet_v1';

export interface GuestPet {
  name: string;
  species: string;
  breed: string;
  photoDataUrl?: string;
  createdAt: string;
}

/** Local-only "try before login" pet. Never touches Firestore — see claimGuestPet for the migration step. */
export function saveGuestPet(pet: GuestPet): void {
  try {
    localStorage.setItem(GUEST_PET_KEY, JSON.stringify(pet));
  } catch {
    /* localStorage unavailable (private mode, quota) — guest flow degrades to non-persistent, never blocks the app. */
  }
}

export function getGuestPet(): GuestPet | null {
  try {
    const raw = localStorage.getItem(GUEST_PET_KEY);
    return raw ? (JSON.parse(raw) as GuestPet) : null;
  } catch {
    return null;
  }
}

export function clearGuestPet(): void {
  try {
    localStorage.removeItem(GUEST_PET_KEY);
  } catch {
    /* no-op */
  }
}
