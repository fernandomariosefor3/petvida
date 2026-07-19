import { useState } from 'react';
import { enableReminderNotifications } from '@/lib/notifications';

export default function NotificationBanner({ userId }: { userId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'hidden'>(
    typeof Notification === 'undefined' || Notification.permission !== 'default' ? 'hidden' : 'idle'
  );

  if (status === 'hidden') return null;

  async function handleEnable() {
    setStatus('loading');
    const result = await enableReminderNotifications(userId);
    setStatus(result === 'granted' ? 'done' : 'hidden');
  }

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        <i className="ri-notification-3-line text-emerald-500"></i>
      </div>
      <p className="text-sm text-emerald-700 flex-1">Ative notificações para não perder nenhum lembrete de vacina ou consulta.</p>
      <button
        onClick={handleEnable}
        disabled={status === 'loading'}
        className="text-xs px-4 py-2 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer whitespace-nowrap"
      >
        {status === 'loading' ? 'Ativando...' : 'Ativar'}
      </button>
    </div>
  );
}
