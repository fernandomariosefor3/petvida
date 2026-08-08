import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

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

/** Calls the only public Cloud Function in the project — works for anonymous visitors, no login required. */
export async function fetchPublicSosProfile(publicSosId: string): Promise<PublicSosProfile> {
  const getPublicSosProfileFn = httpsCallable<{ publicSosId: string }, PublicSosProfile>(functions, 'getPublicSosProfile');
  const result = await getPublicSosProfileFn({ publicSosId });
  return result.data;
}

export function buildSosUrl(publicSosId: string): string {
  const siteUrl = (import.meta.env.VITE_SITE_URL as string) || 'https://petvida.net.br';
  return `${siteUrl}/p/${publicSosId}`;
}
