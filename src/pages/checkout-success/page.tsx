import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { usePlans } from '@/lib/plans';
import { trackEvent } from '@/lib/analytics';

export default function CheckoutSuccessPage() {
  const [visible, setVisible] = useState(false);
  const { planId } = useApp();
  const { plans } = usePlans();
  const purchasedPlan = planId === 'free' ? plans.pro : plans[planId];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    trackEvent('checkout_completed');
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 flex items-center justify-center">
            <img src="/logo.png" alt="PetVida" className="w-7 h-7 object-contain" />
          </div>
          <span className="font-bold text-gray-800 text-base">PetVida</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div
          className={`w-full max-w-lg transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-10 text-center">
              <div className="relative inline-flex items-center justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                    <i className="ri-checkbox-circle-fill text-emerald-500 text-4xl"></i>
                  </div>
                </div>
                <span className="absolute -top-1 -right-1 text-amber-300 text-2xl animate-bounce">✦</span>
                <span className="absolute -bottom-1 -left-1 text-white/60 text-lg animate-pulse">✦</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Pagamento confirmado!</h1>
              <p className="text-emerald-100 text-base">
                Seu <strong className="text-white">Plano {purchasedPlan.name}</strong> está ativo — obrigado por apoiar o PetVida!
              </p>

              <div className="inline-flex items-center gap-2 mt-5 bg-white/15 border border-white/25 rounded-full px-5 py-2">
                <i className="ri-vip-crown-line text-white text-sm"></i>
                <span className="text-white font-semibold text-sm">{purchasedPlan.name}</span>
                <span className="text-emerald-100 text-sm">&mdash; R${(purchasedPlan.price / 100).toFixed(2).replace('.', ',')}/ano</span>
              </div>
            </div>

            <div className="px-8 py-8">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
                <div className="w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <i className="ri-information-line text-amber-500"></i>
                </div>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Um <strong>recibo do pagamento</strong> foi enviado para o seu e-mail pela Stripe. Pode levar até 1 minuto para o seu plano aparecer como Pro no app.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/dashboard"
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-center transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <i className="ri-dashboard-line"></i>
                  Ir para o Dashboard
                </Link>
                <Link
                  to="/planos"
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl text-center transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <i className="ri-vip-crown-line"></i>
                  Ver meu plano
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              Precisa de ajuda?{' '}
              <a href="mailto:0pet0vida0@gmail.com" className="text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer">
                0pet0vida0@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
