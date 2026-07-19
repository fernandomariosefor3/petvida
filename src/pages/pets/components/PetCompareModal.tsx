import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Pet, Reminder } from '@/types';

interface Props {
  pets: Pet[];
  reminders: Reminder[];
  onClose: () => void;
}

const MAX_SELECTION = 4;

function getAge(birthDate: string): string {
  if (!birthDate) return '—';
  const bd = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth());
  if (months < 12) return `${months}m`;
  return `${Math.floor(months / 12)}a`;
}

function lastReminderDate(reminders: Reminder[], petId: string): string {
  const petReminders = reminders.filter((r) => r.petId === petId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (petReminders.length === 0) return '—';
  return new Date(petReminders[0].date + 'T00:00:00').toLocaleDateString('pt-BR');
}

export default function PetCompareModal({ pets, reminders, onClose }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, id];
    });
  };

  const selected = pets.filter((p) => selectedIds.includes(p.id));
  const chartData = selected.map((p) => ({ name: p.name, peso: p.weight }));

  const rows: { label: string; get: (p: Pet) => string }[] = [
    { label: 'Espécie', get: (p) => p.species },
    { label: 'Raça', get: (p) => p.breed || '—' },
    { label: 'Idade', get: (p) => getAge(p.birthDate) },
    { label: 'Peso', get: (p) => `${p.weight} kg` },
    { label: 'Castrado', get: (p) => (p.neutered ? 'Sim' : 'Não') },
    { label: 'Último lembrete', get: (p) => lastReminderDate(reminders, p.id) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">Comparar pets</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 mb-3">Escolha de 2 a {MAX_SELECTION} pets ({selectedIds.length}/{MAX_SELECTION})</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {pets.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  disabled={!isSelected && selectedIds.length >= MAX_SELECTION}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isSelected ? 'border-violet-400 bg-violet-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {p.photo && <img src={p.photo} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <span className={`text-xs font-medium truncate ${isSelected ? 'text-violet-700' : 'text-gray-600'}`}>{p.name}</span>
                </button>
              );
            })}
          </div>

          {selected.length >= 2 ? (
            <>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 uppercase">Atributo</th>
                      {selected.map((p) => (
                        <th key={p.id} className="text-left py-2 px-3 text-xs font-semibold text-gray-700">{p.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.label} className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-xs font-medium text-gray-400">{row.label}</td>
                        {selected.map((p) => (
                          <td key={p.id} className="py-2.5 px-3 text-sm text-gray-700">{row.get(p)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Comparação de peso</p>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="kg" />
                    <Tooltip formatter={(value: number) => [`${value} kg`, 'Peso']} />
                    <Bar dataKey="peso" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">Selecione pelo menos 2 pets para comparar.</div>
          )}
        </div>
      </div>
    </div>
  );
}
