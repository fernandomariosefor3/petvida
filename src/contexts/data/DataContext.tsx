import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { determineImageMime } from '@/lib/imageMime';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '@/lib/firebase';
import { trackEvent } from '@/lib/analytics';
import { Pet, Reminder, HealthRecord } from '@/types';
import { useAuth } from '@/contexts/auth/AuthContext';

interface DataContextType {
  pets: Pet[]; reminders: Reminder[]; healthRecords: HealthRecord[];
  dataLoading: boolean;
  getPetById: (id: string) => Pet | undefined;
  uploadPhoto: (file: File, path: string) => Promise<string>;
  addPet: (pet: Omit<Pet, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updatePet: (id: string, pet: Partial<Pet>) => Promise<void>;
  deletePet: (id: string) => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateReminder: (id: string, reminder: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  addHealthRecord: (record: Omit<HealthRecord, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateHealthRecord: (id: string, record: Partial<HealthRecord>) => Promise<void>;
  deleteHealthRecord: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

function tsToString(val: unknown): string {
  if (!val) return '';
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return String(val);
}

function mapPet(id: string, data: Record<string, unknown>): Pet {
  return {
    id, userId: (data.userId as string) ?? '', name: (data.name as string) ?? '',
    species: (data.species as string) ?? '', breed: (data.breed as string) ?? '',
    birthDate: (data.birthDate as string) ?? '', weight: (data.weight as number) ?? 0,
    color: (data.color as string) ?? '', gender: ((data.gender as 'male' | 'female') ?? 'male'),
    photo: (data.photo as string) ?? '', microchip: (data.microchip as string) ?? '',
    neutered: (data.neutered as boolean) ?? false, bloodType: (data.bloodType as string) ?? '',
    allergies: (data.allergies as string) ?? '', notes: (data.notes as string) ?? '',
    createdAt: tsToString(data.createdAt),
  };
}

function mapReminder(id: string, data: Record<string, unknown>): Reminder {
  return {
    id, petId: (data.petId as string) ?? '', userId: (data.userId as string) ?? '',
    title: (data.title as string) ?? '', type: (data.type as Reminder['type']) ?? 'other',
    date: (data.date as string) ?? '', time: (data.time as string) ?? '',
    notes: (data.notes as string) ?? '', completed: (data.completed as boolean) ?? false,
    completedAt: (data.completedAt as string) || undefined,
    createdAt: tsToString(data.createdAt),
  };
}

function mapHealthRecord(id: string, data: Record<string, unknown>): HealthRecord {
  return {
    id, petId: (data.petId as string) ?? '', userId: (data.userId as string) ?? '',
    type: (data.type as HealthRecord['type']) ?? 'other', date: (data.date as string) ?? '',
    weight: (data.weight as number | undefined) ?? undefined,
    notes: (data.notes as string) ?? '', vet: (data.vet as string) ?? '',
    clinic: (data.clinic as string) ?? '', attachmentUrl: (data.attachmentUrl as string) ?? '',
    createdAt: tsToString(data.createdAt),
  };
}


function stripInternalFields<T extends object>(obj: Partial<T>): Record<string, unknown> {
  const excluded = new Set(['id', 'userId', 'createdAt']);
  return Object.fromEntries(Object.entries(obj).filter(([k, v]) => !excluded.has(k) && v !== undefined));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { firebaseUser } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!firebaseUser) { setPets([]); setReminders([]); setHealthRecords([]); return; }
    setDataLoading(true);
    const uid = firebaseUser.uid;
    let resolved = 0;
    const markDone = () => { if (++resolved === 3) setDataLoading(false); };

    const unsubPets = onSnapshot(
      query(collection(db, 'pets'), where('userId', '==', uid), orderBy('createdAt', 'asc')),
      (snap) => { setPets(snap.docs.map(d => mapPet(d.id, d.data()))); markDone(); },
      (err) => { console.error('Pets listener error:', err); markDone(); }
    );
    const unsubReminders = onSnapshot(
      query(collection(db, 'reminders'), where('userId', '==', uid), orderBy('date', 'asc')),
      (snap) => { setReminders(snap.docs.map(d => mapReminder(d.id, d.data()))); markDone(); },
      (err) => { console.error('Reminders listener error:', err); markDone(); }
    );
    const unsubHealth = onSnapshot(
      query(collection(db, 'healthRecords'), where('userId', '==', uid), orderBy('date', 'desc')),
      (snap) => { setHealthRecords(snap.docs.map(d => mapHealthRecord(d.id, d.data()))); markDone(); },
      (err) => { console.error('Health listener error:', err); markDone(); }
    );
    return () => { unsubPets(); unsubReminders(); unsubHealth(); };
  }, [firebaseUser]);

  const getPetById = useCallback((id: string) => pets.find(p => p.id === id), [pets]);

    const uploadPhoto = async (file: File, path: string): Promise<string> => {
      const normalizedMime = determineImageMime(file);
      if (!normalizedMime) throw new Error('Tipo de arquivo não suportado. Use JPG, PNG ou WEBP.');

      // Enforce size limit of 5 MB
      const maxBytes = 5 * 1024 * 1024;
      if (file.size > maxBytes) throw new Error('Arquivo maior que 5 MB.');

      const storageRef = ref(storage, path);
      // Pass explicit metadata so Firebase Storage will have a proper contentType even when
      // the browser did not provide one.
      await uploadBytes(storageRef, file, { contentType: normalizedMime });
      return getDownloadURL(storageRef);
    };

  const addPet = async (pet: Omit<Pet, 'id' | 'userId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    const isFirstPet = pets.length === 0;
    // Pet creation is validated and counted atomically server-side (see
    // functions/src/pets.ts) — the client can no longer create pet docs
    // directly, so plan limits can't be bypassed by calling Firestore direct.
    const createPetFn = httpsCallable<Record<string, unknown>, { id: string }>(functions, 'createPet');
    await createPetFn(pet);
    if (isFirstPet) trackEvent('first_pet_added');
  };
  const updatePet = async (id: string, pet: Partial<Pet>) => {
    await updateDoc(doc(db, 'pets', id), stripInternalFields(pet));
  };
  const deletePet = async (id: string) => {
    const deletePetFn = httpsCallable<{ petId: string }, { success: boolean }>(functions, 'deletePet');
    await deletePetFn({ petId: id });
  };
  const addReminder = async (reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    const createReminderFn = httpsCallable<Record<string, unknown>, { id: string }>(functions, 'createReminder');
    await createReminderFn(reminder);
    trackEvent('reminder_created', { type: reminder.type });
  };
  const updateReminder = async (id: string, reminder: Partial<Reminder>) => {
    await updateDoc(doc(db, 'reminders', id), stripInternalFields(reminder));
  };
  const deleteReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    const deleteReminderFn = httpsCallable<{ reminderId: string }, { success: boolean }>(functions, 'deleteReminder');
    await deleteReminderFn({ reminderId: id });
    if (reminder && !reminder.completed) trackEvent('reminder_skipped', { type: reminder.type });
  };
  const toggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    const completed = !reminder.completed;
    await updateDoc(doc(db, 'reminders', id), {
      completed,
      completedAt: completed ? new Date().toISOString().split('T')[0] : '',
    });
    if (completed) trackEvent('reminder_completed', { type: reminder.type });
  };
  const addHealthRecord = async (record: Omit<HealthRecord, 'id' | 'userId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    await addDoc(collection(db, 'healthRecords'), { userId: firebaseUser.uid, ...record, createdAt: serverTimestamp() });
    trackEvent('health_record_added', { type: record.type });
  };
  const updateHealthRecord = async (id: string, record: Partial<HealthRecord>) => {
    await updateDoc(doc(db, 'healthRecords', id), stripInternalFields(record));
  };
  const deleteHealthRecord = async (id: string) => { await deleteDoc(doc(db, 'healthRecords', id)); };

  return (
    <DataContext.Provider value={{
      pets, reminders, healthRecords, dataLoading, getPetById, uploadPhoto,
      addPet, updatePet, deletePet, addReminder, updateReminder, deleteReminder,
      toggleReminder, addHealthRecord, updateHealthRecord, deleteHealthRecord,
    }}>
      {children}
    </DataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- Provider + hook colocated by design
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}