import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export interface PublicSosProfile {
  name: string;
  species: string;
  breed: string;
  photo: string;
  sosContactName: string;
  sosPhone: string;
  sosWhatsapp: string;
  sosMedicalNotes: string;
}

/**
 * The only public, unauthenticated read path in the project. Deliberately
 * whitelists the fields it returns instead of forwarding the pet document —
 * userId, microchip, allergies and notes must never leak here.
 */
export async function getPublicSosProfileHandler(db: Firestore, publicSosId: string): Promise<PublicSosProfile> {
  const snap = await db.collection('pets')
    .where('publicSosId', '==', publicSosId)
    .where('isSosEnabled', '==', true)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new HttpsError('not-found', 'Perfil SOS não encontrado.');
  }

  const data = snap.docs[0].data();
  return {
    name: (data.name as string) ?? '',
    species: (data.species as string) ?? '',
    breed: (data.breed as string) ?? '',
    photo: (data.photo as string) ?? '',
    sosContactName: (data.sosContactName as string) ?? '',
    sosPhone: (data.sosPhone as string) ?? '',
    sosWhatsapp: (data.sosWhatsapp as string) ?? '',
    sosMedicalNotes: (data.sosMedicalNotes as string) ?? '',
  };
}

export const getPublicSosProfile = onCall(async (request) => {
  const publicSosId = request.data?.publicSosId;
  if (typeof publicSosId !== 'string' || !publicSosId) {
    throw new HttpsError('invalid-argument', 'publicSosId é obrigatório.');
  }
  return getPublicSosProfileHandler(getFirestore(), publicSosId);
});
