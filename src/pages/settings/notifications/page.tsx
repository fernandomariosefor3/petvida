import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useApp } from '@/contexts/AppContext';
import { db } from '@/lib/firebase';
import { DEFAULT_NOTIFICATION_SETTINGS, NotificationSettings } from '@/types';
import NotificationBanner from '@/components/feature/NotificationBanner';

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 6); // 6h..22h

export default function NotificationSettingsPage() {
  const { currentUser } = useApp();
  const [settings, setSettings] = useState<NotificationSettings>(
    currentUser?.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!currentUser) return null;

  async function persist(next: NotificationSettings) {
    setSettings(next);
    setSaving(true);
    setSaved(false);
    try {
      await updateDoc(doc(db, 'users', currentUser!.id), { notificationSettings: next });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const Toggle = ({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
      <div className="pr-4">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
      </label>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Notificações</h1>
          <p className="text-gray-500 text-sm mt-1">Escolha quando e como você quer ser avisado</p>
        </div>

        <NotificationBanner userId={currentUser.id} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Toggle
            label="Lembretes do dia"
            description="Avisa no dia do lembrete (vacina, consulta, medicação...)"
            checked={settings.remindersEnabled}
            onChange={(v) => persist({ ...settings, remindersEnabled: v })}
          />
          <Toggle
            label="Lembretes de urgência"
            description="Aviso antecipado, 1 dia antes, para vacinas"
            checked={settings.urgentEnabled}
            onChange={(v) => persist({ ...settings, urgentEnabled: v })}
          />
          <Toggle
            label="Resumo semanal"
            description="Um resumo aos domingos às 18h com o que vem pela frente"
            checked={settings.weeklySummaryEnabled}
            onChange={(v) => persist({ ...settings, weeklySummaryEnabled: v })}
          />

          <div className="pt-4">
            <label className="block text-sm font-semibold text-gray-800 mb-1">Horário preferencial</label>
            <p className="text-xs text-gray-400 mb-3">Os lembretes do dia chegam nesse horário</p>
            <select
              value={settings.preferredHour}
              onChange={(e) => persist({ ...settings, preferredHour: parseInt(e.target.value) })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 cursor-pointer"
            >
              {HOUR_OPTIONS.map(h => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>

          <div className="h-5 mt-4">
            {saving && <p className="text-xs text-gray-400">Salvando...</p>}
            {saved && <p className="text-xs text-emerald-600 font-medium"><i className="ri-check-line mr-1"></i>Preferências salvas</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
