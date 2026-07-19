import { Reminder } from '@/types';

const MAX_LOOKBACK_DAYS = 365;

/**
 * Consecutive days (ending today) with no unresolved reminder due on that day,
 * as observed right now. Approximates a "care streak" without needing
 * historical daily snapshots — it breaks at the most recent day that still
 * has an incomplete reminder due.
 */
export function computeCareStreak(reminders: Reminder[], today: Date = new Date()): number {
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  let streak = 0;

  for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
    const dateStr = cursor.toISOString().split('T')[0];
    const dueThatDay = reminders.filter((r) => r.date === dateStr);
    const hasUnresolved = dueThatDay.some((r) => !r.completed);
    if (hasUnresolved) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function streakBadge(streak: number): { emoji: string; label: string } | null {
  if (streak >= 100) return { emoji: '⭐', label: '100 dias' };
  if (streak >= 30) return { emoji: '🔥', label: '30 dias' };
  if (streak >= 7) return { emoji: '🏆', label: '7 dias' };
  return null;
}
