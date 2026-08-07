import { useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useGuest } from '@/contexts/guest/GuestContext';
import { claimGuestPet } from '@/lib/guestPetClaim';

/**
 * Renders nothing. Migrates a locally-stored guest pet into the account once
 * one exists after sign-up/login.
 *
 * Kept as a component rather than folded into AuthContext so the auth logic
 * stays untouched (project rule) — this only reads from it, same pattern as
 * ActivityTracker.
 */
export default function GuestPetClaimer() {
  const { firebaseUser, addPet, uploadPhoto } = useApp();
  const { guestPet, clearGuestPetState } = useGuest();
  const claimAttempted = useRef(false);

  useEffect(() => {
    if (!firebaseUser || !guestPet || claimAttempted.current) return;
    claimAttempted.current = true;
    claimGuestPet({ guestPet, userId: firebaseUser.uid, uploadPhoto, addPet })
      .then(clearGuestPetState)
      .catch((err) => {
        console.error('Erro ao migrar pet convidado:', err);
        claimAttempted.current = false;
      });
  }, [firebaseUser, guestPet, addPet, uploadPhoto, clearGuestPetState]);

  return null;
}
