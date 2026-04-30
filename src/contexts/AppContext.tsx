import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp, writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { User, Pet, Reminder, HealthRecord, Plan, PLAN_LIMITS } from '@/types';

interface AppContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  pets: Pet[];
  reminders: Reminder[];
  healthRecords: HealthRecord[];
  isPremium: boolean;
  planLimits: typeof PLAN_LIMITS.free;
  canAddPet: boolean;
  canUploadPhoto: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
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
  getPetById: (id: string) => Pet | undefined;
  uploadPhoto: (file: File, path: string) => Promise<string>;
}

const AppContext = createContext<AppContextType | null>(null);

function tsToString(val: any): string {
  if (!val) return '';
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return String(val);
}

function mapPet(id: string, data: any): Pet {
  return { id, userId: data.userId ?? '', name: data.name ?? '', species: data.species ?? '', breed: data.breed ?? '', birthDate: data.birthDate ?? '', weight: data.weight ?? 0, color: data.color ?? '', gender: (data.gender as 'male' | 'female') ?? 'male', photo: data.photo ?? '', microchip: data.microchip ?? '', neutered: data.neutered ?? false, bloodType: data.bloodType ?? '', allergies: data.allergies ?? '', notes: data.notes ?? '', createdAt: tsToString(data.createdAt) };
}

function mapReminder(id: string, data: any): Reminder {
  return { id, petId: data.petId ?? '', userId: data.userId ?? '', title: data.title ?? '', type: data.type ?? 'other', date: data.date ?? '', time: data.time ?? '', notes: data.notes ?? '', completed: data.completed ?? false, createdAt: tsToString(data.createdAt) };
}

function mapHealthRecord(id: string, data: any): HealthRecord {
  return { id, petId: data.petId ?? '', userId: data.userId ?? '', type: data.type ?? 'other', date: data.date ?? '', weight: data.weight ?? undefined, notes: data.notes ?? '', vet: data.vet ?? '', clinic: data.clinic ?? '', attachmentUrl: data.attachmentUrl ?? '', createdAt: tsToString(data.createdAt) };
}

function checkPlanActive(plan: Plan, expiresAt: string): boolean {
  if (plan === 'free') return false;
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);

  const isPremium = currentUser ? checkPlanActive(currentUser.plan, currentUser.planExpiresAt) : false;
  const planLimits = isPremium ? PLAN_LIMITS.premium : PLAN_LIMITS.free;
  const canAddPet = pets.length < planLimits.maxPets;
  const canUploadPhoto = planLimits.photoUpload;

  const fetchProfile = useCallback(async (fbUser: FirebaseUser) => {
    const docRef = doc(db, 'users', fbUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const d = docSnap.data();
      setCurrentUser({
        id: fbUser.uid, name: d.name ?? fbUser.displayName ?? '',
        email: fbUser.email ?? '', phone: d.phone ?? '',
        plan: (d.plan as Plan) ?? 'free',
        planExpiresAt: d.planExpiresAt ?? '',
        createdAt: tsToString(d.createdAt),
      });
    } else {
      const newUser: User = {
        id: fbUser.uid, name: fbUser.displayName ?? fbUser.email ?? '',
        email: fbUser.email ?? '', phone: '', plan: 'free', planExpiresAt: '',
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(newUser);
    }
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const [petsSnap, remindersSnap, healthSnap] = await Promise.all([
        getDocs(query(collection(db, 'pets'), where('userId', '==', userId), orderBy('createdAt', 'asc'))),
        getDocs(query(collection(db, 'reminders'), where('userId', '==', userId), orderBy('date', 'asc'))),
        getDocs(query(collection(db, 'healthRecords'), where('userId', '==', userId), orderBy('date', 'desc'))),
      ]);
      setPets(petsSnap.docs.map(d => mapPet(d.id, d.data())));
      setReminders(remindersSnap.docs.map(d => mapReminder(d.id, d.data())));
      setHealthRecords(healthSnap.docs.map(d => mapHealthRecord(d.id, d.data())));
    } catch (err) { console.error('Erro ao carregar dados:', err); }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await fetchProfile(fbUser);
        await fetchUserData(fbUser.uid);
      } else {
        setCurrentUser(null); setPets([]); setReminders([]); setHealthRecords([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchProfile, fetchUserData]);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') return { error: 'E-mail ou senha incorretos.' };
      if (err.code === 'auth/too-many-requests') return { error: 'Muitas tentativas. Tente novamente em alguns minutos.' };
      return { error: 'Erro ao fazer login. Tente novamente.' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', user.uid), { name, email, phone: '', plan: 'free', planExpiresAt: '', createdAt: serverTimestamp() });
      return { error: null };
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') return { error: 'Este e-mail já está em uso.' };
      if (err.code === 'auth/weak-password') return { error: 'A senha deve ter pelo menos 6 caracteres.' };
      return { error: 'Erro ao criar conta. Tente novamente.' };
    }
  };

  const logout = async () => { await signOut(auth); };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try { await sendPasswordResetEmail(auth, email); return { error: null }; }
    catch { return { error: 'Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.' }; }
  };

  const uploadPhoto = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const addPet = async (pet: Omit<Pet, 'id' | 'userId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    const docRef = await addDoc(collection(db, 'pets'), { userId: firebaseUser.uid, name: pet.name, species: pet.species, breed: pet.breed || '', birthDate: pet.birthDate || '', weight: pet.weight || 0, color: pet.color || '', gender: pet.gender, photo: pet.photo || '', microchip: pet.microchip || '', neutered: pet.neutered ?? false, bloodType: pet.bloodType || '', allergies: pet.allergies || '', notes: pet.notes || '', createdAt: serverTimestamp() });
    setPets(prev => [...prev, mapPet(docRef.id, { ...pet, userId: firebaseUser.uid, createdAt: new Date().toISOString() })]);
  };

  const updatePet = async (id: string, pet: Partial<Pet>) => {
    const updateData: any = {};
    Object.entries(pet).forEach(([k, v]) => { if (v !== undefined && k !== 'id' && k !== 'userId' && k !== 'createdAt') updateData[k] = v; });
    await updateDoc(doc(db, 'pets', id), updateData);
    setPets(prev => prev.map(p => p.id === id ? { ...p, ...pet } : p));
  };

  const deletePet = async (id: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'pets', id));
    const remQ = query(collection(db, 'reminders'), where('petId', '==', id));
    const remSnap = await getDocs(remQ);
    remSnap.forEach(d => batch.delete(d.ref));
    const healthQ = query(collection(db, 'healthRecords'), where('petId', '==', id));
    const healthSnap = await getDocs(healthQ);
    healthSnap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    setPets(prev => prev.filter(p => p.id !== id));
    setReminders(prev => prev.filter(r => r.petId !== id));
    setHealthRecords(prev => prev.filter(h => h.petId !== id));
  };

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    const docRef = await addDoc(collection(db, 'reminders'), { userId: firebaseUser.uid, petId: reminder.petId, title: reminder.title, type: reminder.type, date: reminder.date, time: reminder.time || '', notes: reminder.notes || '', completed: reminder.completed ?? false, createdAt: serverTimestamp() });
    setReminders(prev => [...prev, mapReminder(docRef.id, { ...reminder, userId: firebaseUser.uid, createdAt: new Date().toISOString() })]);
  };

  const updateReminder = async (id: string, reminder: Partial<Reminder>) => {
    const updateData: any = {};
    Object.entries(reminder).forEach(([k, v]) => { if (v !== undefined && k !== 'id' && k !== 'userId' && k !== 'createdAt') updateData[k] = v; });
    await updateDoc(doc(db, 'reminders', id), updateData);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...reminder } : r));
  };

  const deleteReminder = async (id: string) => {
    await deleteDoc(doc(db, 'reminders', id));
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const toggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    await updateReminder(id, { completed: !reminder.completed });
  };

  const addHealthRecord = async (record: Omit<HealthRecord, 'id' | 'userId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    const docRef = await addDoc(collection(db, 'healthRecords'), { userId: firebaseUser.uid, petId: record.petId, type: record.type, date: record.date, weight: record.weight ?? null, notes: record.notes || '', vet: record.vet || '', clinic: record.clinic || '', attachmentUrl: record.attachmentUrl || '', createdAt: serverTimestamp() });
    setHealthRecords(prev => [mapHealthRecord(docRef.id, { ...record, userId: firebaseUser.uid, createdAt: new Date().toISOString() }), ...prev]);
  };

  const updateHealthRecord = async (id: string, record: Partial<HealthRecord>) => {
    const updateData: any = {};
    Object.entries(record).forEach(([k, v]) => { if (v !== undefined && k !== 'id' && k !== 'userId' && k !== 'createdAt') updateData[k] = v; });
    await updateDoc(doc(db, 'healthRecords', id), updateData);
    setHealthRecords(prev => prev.map(h => h.id === id ? { ...h, ...record } : h));
  };

  const deleteHealthRecord = async (id: string) => {
    await deleteDoc(doc(db, 'healthRecords', id));
    setHealthRecords(prev => prev.filter(h => h.id !== id));
  };

  const getPetById = (id: string) => pets.find(p => p.id === id);

  return (
    <AppContext.Provider value={{ currentUser, firebaseUser, loading, pets, reminders, healthRecords, isPremium, planLimits, canAddPet, canUploadPhoto, login, register, logout, resetPassword, addPet, updatePet, deletePet, addReminder, updateReminder, deleteReminder, toggleReminder, addHealthRecord, updateHealthRecord, deleteHealthRecord, getPetById, uploadPhoto }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
