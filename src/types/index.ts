export type Plan = 'free' | 'premium';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: Plan;
  planExpiresAt: string;
  createdAt: string;
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

// Plan limits
export const PLAN_LIMITS = {
  free: {
    maxPets: 3,
    maxRemindersPerPet: 5,
    photoUpload: false,
    healthRecords: true,
    exportData: false,
    label: 'Grátis',
  },
  premium: {
    maxPets: Infinity,
    maxRemindersPerPet: Infinity,
    photoUpload: true,
    healthRecords: true,
    exportData: true,
    label: 'Premium',
  },
} as const;
