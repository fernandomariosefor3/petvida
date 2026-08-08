import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getTestDb, clearFirestore } from './helpers.js';
import { getPublicSosProfileHandler } from '../src/sos.js';

const db = getTestDb();

beforeEach(async () => {
  await clearFirestore();
});

async function seedPet(id: string, data: Record<string, unknown>) {
  await db.doc(`pets/${id}`).set(data);
}

test('returns the SOS profile when isSosEnabled is true', async () => {
  await seedPet('pet1', {
    userId: 'owner1', name: 'Rex', species: 'Cão', breed: 'Vira-lata', photo: 'https://x/rex.jpg',
    isSosEnabled: true, publicSosId: 'abc-123',
    sosContactName: 'Fernando', sosPhone: '+5585999999999', sosWhatsapp: '+5585999999999',
    sosMedicalNotes: 'Alérgico a frango',
  });

  const profile = await getPublicSosProfileHandler(db, 'abc-123');
  assert.equal(profile.name, 'Rex');
  assert.equal(profile.sosContactName, 'Fernando');
  assert.equal(profile.sosMedicalNotes, 'Alérgico a frango');
});

test('never leaks fields outside the whitelist', async () => {
  await seedPet('pet1', {
    userId: 'owner1', name: 'Rex', species: 'Cão', breed: '', photo: '',
    isSosEnabled: true, publicSosId: 'abc-123',
    sosContactName: '', sosPhone: '', sosWhatsapp: '', sosMedicalNotes: '',
    microchip: 'CHIP-999', allergies: 'segredo interno', notes: 'nota privada',
  });

  const profile = await getPublicSosProfileHandler(db, 'abc-123');
  assert.deepEqual(Object.keys(profile).sort(), [
    'breed', 'name', 'photo', 'sosContactName', 'sosMedicalNotes', 'sosPhone', 'sosWhatsapp', 'species',
  ]);
  assert.equal((profile as unknown as Record<string, unknown>).userId, undefined);
  assert.equal((profile as unknown as Record<string, unknown>).microchip, undefined);
});

test('404s when no pet matches the publicSosId', async () => {
  await assert.rejects(
    () => getPublicSosProfileHandler(db, 'does-not-exist'),
    (err: unknown) => (err as { code?: string }).code === 'not-found'
  );
});

test('404s when isSosEnabled is false, even with a matching publicSosId', async () => {
  await seedPet('pet1', {
    userId: 'owner1', name: 'Rex', species: 'Cão', breed: '', photo: '',
    isSosEnabled: false, publicSosId: 'abc-123',
  });

  await assert.rejects(
    () => getPublicSosProfileHandler(db, 'abc-123'),
    (err: unknown) => (err as { code?: string }).code === 'not-found'
  );
});
