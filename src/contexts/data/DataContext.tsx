import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp,
  writeBatch, onSnapshot, getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
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
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const addPet = async (pet: Omit<Pet, 'id' | 'userId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    await addDoc(collection(db, 'pets'), { userId: firebaseUser.uid, ...pet, createdAt: serverTimestamp() });
  };
  const updatePet = async (id: string, pet: Partial<Pet>) => {
    await updateDoc(doc(db, 'pets', id), stripInternalFields(pet));
  };
  const deletePet = async (id: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'pets', id));
    const [remSnap, healthSnap] = await Promise.all([
      getDocs(query(collection(db, 'reminders'), where('petId', '==', id))),
      getDocs(query(collection(db, 'healthRecords'), where('petId', '==', id))),
    ]);
    remSnap.forEach(d => batch.delete(d.ref));
    healthSnap.forEach(d => batch.delete(d.ref));
    await batch.commit();
  };
  const addReminder = async (reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    await addDoc(collection(db, 'reminders'), { userId: firebaseUser.uid, ...reminder, createdAt: serverTimestamp() });
  };
  const updateReminder = async (id: string, reminder: Partial<Reminder>) => {
    await updateDoc(doc(db, 'reminders', id), stripInternalFields(reminder));
  };
  const deleteReminder = async (id: string) => { await deleteDoc(doc(db, 'reminders', id)); };
  const toggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    await updateDoc(doc(db, 'reminders', id), { completed: !reminder.completed });
  };
  const addHealthRecord = async (record: Omit<HealthRecord, 'id' | 'userId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    await addDoc(collection(db, 'healthRecords'), { userId: firebaseUser.uid, ...record, createdAt: serverTimestamp() });
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

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}