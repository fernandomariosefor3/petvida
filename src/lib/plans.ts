import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plan, PlanConfig, PLAN_LIMITS } from '@/types';

let cachedPlans: Record<Plan, PlanConfig> | null = null;

function mapPlanDoc(id: string, data: Record<string, unknown>): PlanConfig {
  const fallback = PLAN_LIMITS[id as Plan] ?? PLAN_LIMITS.free;
  return {
    id: id as Plan,
    name: (data.name as string) ?? fallback.name,
    label: (data.name as string) ?? fallback.label,
    maxPets: (data.maxPets as number) ?? fallback.maxPets,
    maxRemindersPerPet: (data.maxRemindersPerPet as number) ?? fallback.maxRemindersPerPet,
    photoUpload: (data.features as string[] | undefined)?.includes('photoUpload') ?? fallback.photoUpload,
    healthRecords: (data.features as string[] | undefined)?.includes('healthRecords') ?? fallback.healthRecords,
    exportData: (data.features as string[] | undefined)?.includes('exportData') ?? fallback.exportData,
    price: (data.price as number) ?? fallback.price,
    active: (data.active as boolean) ?? true,
    order: (data.order as number) ?? fallback.order,
  };
}

async function fetchPlans(): Promise<Record<Plan, PlanConfig>> {
  const snap = await getDocs(collection(db, 'plans'));
  if (snap.empty) return PLAN_LIMITS;
  const result = { ...PLAN_LIMITS };
  snap.docs.forEach((d) => {
    result[d.id as Plan] = mapPlanDoc(d.id, d.data());
  });
  return result;
}

/** Plans loaded from Firestore, falling back to the static PLAN_LIMITS until the fetch resolves. */
export function usePlans(): { plans: Record<Plan, PlanConfig>; plansLoading: boolean } {
  const [plans, setPlans] = useState<Record<Plan, PlanConfig>>(cachedPlans ?? PLAN_LIMITS);
  const [plansLoading, setPlansLoading] = useState(!cachedPlans);

  useEffect(() => {
    if (cachedPlans) return;
    fetchPlans()
      .then((result) => { cachedPlans = result; setPlans(result); })
      .catch(() => { /* keep static fallback on error */ })
      .finally(() => setPlansLoading(false));
  }, []);

  return { plans, plansLoading };
}
