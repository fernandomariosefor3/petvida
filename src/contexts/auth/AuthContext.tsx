import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail, User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { trackEvent } from '@/lib/analytics';
import { User, Plan, NotificationSettings } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function tsToString(val: unknown): string {
  if (!val) return '';
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return String(val);
}

function mapUser(uid: string, data: Record<string, unknown>, fallbackEmail: string, fallbackName: string): User {
  return {
    id: uid,
    name: (data.name as string) ?? fallbackName,
    email: (data.email as string) ?? fallbackEmail,
    phone: (data.phone as string) ?? '',
    plan: ((data.plan as Plan) ?? 'free'),
    planExpiresAt: tsToString(data.planExpiresAt),
    createdAt: tsToString(data.createdAt),
    paymentFailedAt: data.paymentFailedAt ? tsToString(data.paymentFailedAt) : undefined,
    notificationSettings: data.notificationSettings as NotificationSettings | undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (fbUser: FirebaseUser) => {
    const docRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      setCurrentUser(mapUser(fbUser.uid, snap.data(), fbUser.email ?? '', fbUser.displayName ?? ''));
    } else {
      setCurrentUser({
        id: fbUser.uid, name: fbUser.displayName ?? fbUser.email ?? '',
        email: fbUser.email ?? '', phone: '', plan: 'free', planExpiresAt: '',
        createdAt: new Date().toISOString(),
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (firebaseUser) await fetchProfile(firebaseUser);
  }, [firebaseUser, fetchProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await fetchProfile(fbUser);
        // Force-refresh so a claim granted moments ago (see
        // functions/scripts/set-admin-claim.mjs) is visible without
        // requiring the user to sign out and back in.
        const tokenResult = await fbUser.getIdTokenResult(true);
        setIsAdmin(tokenResult.claims.admin === true);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchProfile]);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential')
        return { error: 'E-mail ou senha incorretos.' };
      if (code === 'auth/too-many-requests')
        return { error: 'Muitas tentativas. Tente novamente em alguns minutos.' };
      return { error: 'Erro ao fazer login. Tente novamente.' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', user.uid), {
        name, email, phone: '', plan: 'free', planExpiresAt: '', createdAt: serverTimestamp(),
      });
      trackEvent('user_registered', { method: 'email' });
      return { error: null };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-in-use') return { error: 'Este e-mail já está em uso.' };
      if (code === 'auth/weak-password') return { error: 'A senha deve ter pelo menos 6 caracteres.' };
      return { error: 'Erro ao criar conta. Tente novamente.' };
    }
  };

  const logout = async () => { await signOut(auth); };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch {
      return { error: 'Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.' };
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, firebaseUser, isAdmin, loading, login, register, logout, resetPassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- Provider + hook colocated by design
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
