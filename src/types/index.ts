export type Plan = 'free' | 'pro' | 'premium';

export interface NotificationSettings {
  remindersEnabled: boolean;
  urgentEnabled: boolean;
  weeklySummaryEnabled: boolean;
  preferredHour: number; // 6-22
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  remindersEnabled: true,
  urgentEnabled: true,
  weeklySummaryEnabled: true,
  preferredHour: 8,
};

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: Plan;
  planExpiresAt: string;
  createdAt: string;
  paymentFailedAt?: string;
  notificationSettings?: NotificationSettings;
}

export interface PlanConfig {
  id: Plan;
  name: string;
  maxPets: number;
  maxRemindersPerPet: number;
  photoUpload: boolean;
  healthRecords: boolean;
  exportData: boolean;
  price: number;
  label: string;
  active: boolean;
  order: number;
}

export interface Pet {
  id: string;
  userId: string;
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  weight: number;
  color: string;
  gender: 'male' | 'female';
  photo: string;
  microchip: string;
  neutered: boolean;
  bloodType: string;
  allergies: string;
  notes: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  petId: string;
  userId: string;
  title: string;
  type: 'vaccine' | 'appointment' | 'medication' | 'grooming' | 'other';
  date: string;
  time: string;
  notes: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  petId: string;
  userId: string;
  type: 'appointment' | 'vaccine' | 'weight' | 'exam' | 'surgery' | 'other';
  date: string;
  weight?: number;
  notes: string;
  vet: string;
  clinic: string;
  attachmentUrl: string;
  createdAt: string;
}

// Sentinel used instead of Infinity — Firestore documents cannot store Infinity.
export const UNLIMITED = -1;

export function isUnlimited(limit: number): boolean {
  return limit === UNLIMITED;
}

// Fallback plan limits, used until the 'plans' Firestore collection loads (see src/lib/plans.ts).
// Keep these in sync with the seed data in scripts/seed-plans.mjs.
export const PLAN_LIMITS: Record<Plan, PlanConfig> = {
  free: {
    id: 'free', name: 'Grátis', label: 'Grátis',
    maxPets: 3, maxRemindersPerPet: 5,
    photoUpload: false, healthRecords: true, exportData: false,
    price: 0, active: true, order: 0,
  },
  pro: {
    id: 'pro', name: 'Pro', label: 'Pro',
    maxPets: 10, maxRemindersPerPet: 15,
    photoUpload: true, healthRecords: true, exportData: false,
    price: 1490, active: true, order: 1,
  },
  premium: {
    id: 'premium', name: 'Premium', label: 'Premium',
    maxPets: UNLIMITED, maxRemindersPerPet: UNLIMITED,
    photoUpload: true, healthRecords: true, exportData: true,
    price: 2999, active: true, order: 2,
  },
};
