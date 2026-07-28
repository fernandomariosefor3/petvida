import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { pingUserActivity } from '@/lib/activity';

/**
 * Renders nothing. Exists only to stamp lastActiveAt once the user is known.
 *
 * Kept as a component rather than folded into AuthContext so the auth logic
 * stays untouched (project rule) — this only reads from it.
 */
export default function ActivityTracker() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.id) void pingUserActivity(currentUser.id);
  }, [currentUser?.id]);

  return null;
}
