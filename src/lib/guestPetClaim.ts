import { GuestPet } from '@/lib/guestPet';
import { dataUrlToFile } from '@/lib/imageCompress';
import { trackEvent } from '@/lib/analytics';
import { Pet } from '@/types';

interface ClaimGuestPetInput {
  guestPet: GuestPet;
  userId: string;
  uploadPhoto: (file: File, path: string) => Promise<string>;
  addPet: (pet: Omit<Pet, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
}

/** Migrates a locally-stored "try before login" pet into the newly created account. */
export async function claimGuestPet({ guestPet, userId, uploadPhoto, addPet }: ClaimGuestPetInput): Promise<void> {
  let photo = '';
  if (guestPet.photoDataUrl) {
    const file = await dataUrlToFile(guestPet.photoDataUrl, 'guest-pet.jpg');
    photo = await uploadPhoto(file, `pets/${userId}/${Date.now()}_guest.jpg`);
  }

  await addPet({
    name: guestPet.name, species: guestPet.species, breed: guestPet.breed,
    birthDate: '', weight: 0, color: '', gender: 'male', photo,
    microchip: '', neutered: false, bloodType: '', allergies: '', notes: '',
  });

  trackEvent('guest_pet_claimed');
}
