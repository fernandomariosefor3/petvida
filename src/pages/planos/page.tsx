import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useApp } from '@/contexts/AppContext';
import { usePlans } from '@/lib/plans';
import { functions } from '@/lib/firebase';
import { trackEvent } from '@/lib/analytics';
import { Plan, isUnlimited } from '@/types';

const ACCENT: Record<Plan, { border: string; borderActive: string; badge: string; price: string; button: string }> = {
  free: {
    border: 'border-gray-100', borderActive: 'border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700', price: 'text-gray-800', button: '',
  },
  pro: {
    border: 'border-gray-100', borderActive: 'border-orange-400',
    badge: 'bg-orange-100 text-orange-700', price: 'text-orange-600',
    button: 'bg-orange-500 hover:bg-orange-600',
  },
};

function formatPrice(cents: number): string {
  if (cents === 0) return 'R$0';
  return `R$${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export default function PlanosPage() {
  const { currentUser, planId } = useApp();
  const { plans } = usePlans();
  const [checkoutLoading, setCheckoutLoading] = useState<Plan | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  if (!currentUser) return null;

  async function handleStripeCheckout(targetPlan: 'pro') {
    trackEvent('upgrade_clicked', { from_plan: planId, to_plan: targetPlan });
    setCheckoutLoading(targetPlan);
    setCheckoutError('');
    try {
      trackEvent('checkout_started', { to_plan: targetPlan });
      const createCheckoutSession = httpsCallable<{ plan: string }, { url: string }>(functions, 'createCheckoutSession');
      const { data } = await createCheckoutSession({ plan: targetPlan });
      window.location.href = data.url;
    } catch {
      setCheckoutError('Não foi possível iniciar o pagamento. Tente novamente.');
      setCheckoutLoading(null);
    }
  }

  const featureRows: { label: string; icon: string; get: (p: Plan) => string }[] = [
    { label: 'Cadastro de pets', icon: 'ri-heart-2-line', get: (p) => isUnlimited(plans[p].maxPets) ? 'Ilimitado' : `Até ${plans[p].maxPets}` },
    { label: 'Lembretes por pet', icon: 'ri-alarm-line', get: (p) => isUnlimited(plans[p].maxRemindersPerPet) ? 'Ilimitado' : `Até ${plans[p].maxRemindersPerPet}` },
    { label: 'Histórico de saúde', icon: 'ri-heart-pulse-line', get: (p) => plans[p].healthRecords ? '✓' : '✗' },
    { label: 'Upload de fotos', icon: 'ri-camera-line', get: (p) => plans[p].photoUpload ? '✓' : '✗' },
    { label: 'Exportar dados', icon: 'ri-download-line', get: (p) => plans[p].exportData ? '✓' : '✗' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Escolha seu plano</h1>
          <p className="text-gray-500 text-sm mt-1">Cuide dos seus pets com o plano ideal para você</p>
        </div>

        {planId !== 'free' && (
          <div className={`rounded-2xl p-5 mb-8 flex items-center gap-4 bg-gradient-to-r from-orange-500 to-orange-400`}>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="ri-vip-crown-line text-white text-2xl"></i>
            </div>
            <div>
              <p className="text-white font-bold text-lg">Você é {plans[planId].name}! ★</p>
              <p className="text-white/80 text-sm">
                Plano ativo até {currentUser.planExpiresAt ? new Date(currentUser.planExpiresAt).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {(['free', 'pro'] as Plan[]).map((tier) => {
            const plan = plans[tier];
            const isCurrent = planId === tier;
            const accent = ACCENT[tier];
            return (
              <div key={tier} className={`bg-white rounded-2xl border-2 p-6 relative overflow-hidden ${isCurrent ? accent.borderActive : accent.border}`}>
                {tier === 'pro' && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-4 py-1 transform rotate-45 translate-x-6 translate-y-2">Popular</div>
                )}
                {isCurrent && (
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${accent.badge}`}>
                    {tier === 'free' ? 'Plano atual' : '★ Plano atual'}
                  </span>
                )}
                <h2 className="text-xl font-bold text-gray-800">{plan.name}</h2>
                <div className="mt-2 mb-1">
                  <span className={`text-3xl font-bold ${accent.price}`}>{formatPrice(plan.price)}</span>
                  {plan.price > 0 && <span className="text-gray-400 text-sm">/ano</span>}
                  {plan.price === 0 && <span className="text-gray-400 text-sm">/para sempre</span>}
                </div>
                <ul className="space-y-3 mb-6 mt-4">
                  {featureRows.map((row) => {
                    const value = row.get(tier);
                    const empty = value === '✗';
                    return (
                      <li key={row.label} className={`flex items-center gap-2 text-sm ${empty ? 'text-gray-300' : 'text-gray-600'}`}>
                        <i className={`${empty ? 'ri-close-line' : 'ri-check-line'} ${empty ? '' : accent.price}`}></i>
                        {row.label}{value !== '✓' && value !== '✗' ? `: ${value}` : ''}
                      </li>
                    );
                  })}
                </ul>
                {isCurrent ? (
                  <div className="py-2.5 text-center text-gray-400 text-sm font-medium border border-gray-200 rounded-xl">Seu plano atual</div>
                ) : tier === 'free' ? (
                  <div className="py-2.5 text-center text-gray-300 text-sm font-medium border border-gray-100 rounded-xl">Plano de entrada</div>
                ) : (
                  <div className="space-y-2.5">
                    <button
                      onClick={() => handleStripeCheckout(tier as 'pro')}
                      disabled={checkoutLoading !== null}
                      className={`flex items-center justify-center gap-2 w-full py-3 text-center disabled:opacity-60 text-white font-bold rounded-xl transition-colors cursor-pointer ${accent.button}`}
                    >
                      {checkoutLoading === tier ? (
                        <><i className="ri-loader-4-line animate-spin"></i> Redirecionando...</>
                      ) : (
                        <><i className="ri-bank-card-line"></i> Assinar com cartão</>
                      )}
                    </button>
                    <a
                      href={`https://wa.me/5585987436263?text=Olá! Quero assinar o plano ${plan.name} do PetVida (${formatPrice(plan.price)}/ano). Meu e-mail de cadastro é: `}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-2.5 text-center border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      <i className="ri-whatsapp-line mr-1"></i> Prefiro pagar via PIX/WhatsApp
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {checkoutError && <p className="text-red-500 text-xs text-center -mt-6 mb-6">{checkoutError}</p>}

        {/* How it works */}
        {planId !== 'pro' && (
          <div className="mt-8 bg-orange-50 rounded-2xl p-6 border border-orange-100">
            <h3 className="font-bold text-gray-800 mb-4"><i className="ri-question-line mr-1 text-orange-500"></i>Como assinar por PIX/WhatsApp?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">1</span>
                <p>Clique no botão "Prefiro pagar via PIX/WhatsApp" no plano desejado</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">2</span>
                <p>Envie seu e-mail de cadastro e realize o pagamento via PIX</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">3</span>
                <p>Seu plano será ativado em até 1 hora e você terá acesso aos novos recursos!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
