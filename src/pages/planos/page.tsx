import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { PLANS, PLAN_COMPARISON, isPlanActive } from '@/lib/plans';
import { createCheckoutSession } from '@/lib/stripe';

export default function PlanosPage() {
  const { currentUser, isPremium } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) return null;

  const planActive = isPlanActive(currentUser.plan, currentUser.planExpiresAt);
  const showPremiumBadge = isPremium || planActive;

  async function handleUpgrade() {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await createCheckoutSession(currentUser.id, currentUser.email, 'premium');
      
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.url) {
        // Redirecionar para Stripe Checkout
        window.location.href = result.url;
      }
    } catch (err) {
      setError('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleWhatsAppUpgrade() {
    const message = encodeURIComponent(
      `Olá! Quero assinar o plano Premium do PetVida (R$29,99/ano). Meu e-mail de cadastro é: ${currentUser.email}`
    );
    window.open(`https://wa.me/5585987436263?text=${message}`, '_blank');
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Escolha seu plano</h1>
          <p className="text-gray-500 text-sm mt-1">
            Cuide dos seus pets com o plano ideal para você
          </p>
        </div>

        {/* Current plan status */}
        {showPremiumBadge && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="ri-vip-crown-line text-white text-2xl"></i>
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-lg">Você é Premium! ★</p>
              <p className="text-orange-100 text-sm">
                {currentUser.planExpiresAt
                  ? `Plano ativo até ${new Date(currentUser.planExpiresAt).toLocaleDateString('pt-BR')}`
                  : 'Aproveite todos os benefícios!'}
              </p>
            </div>
            <Link
              to="/settings/billing"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Gerenciar
            </Link>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <i className="ri-error-warning-line text-red-500 text-lg mt-0.5"></i>
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Free Plan */}
          <div
            className={`bg-white rounded-2xl border-2 p-6 transition-all ${
              !showPremiumBadge ? 'border-emerald-400 shadow-lg' : 'border-gray-100'
            }`}
          >
            {!showPremiumBadge && (
              <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                Plano atual
              </span>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{PLANS.free.label}</h2>
              {showPremiumBadge && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  Atual
                </span>
              )}
            </div>

            <div className="mt-2 mb-6">
              <span className="text-3xl font-bold text-gray-800">{PLANS.free.priceLabel}</span>
              <span className="text-gray-400 text-sm">/para sempre</span>
            </div>

            <ul className="space-y-3 mb-6">
              {PLANS.free.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="ri-check-line text-emerald-500"></i>
                  {feature}
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <i className="ri-close-line"></i>
                Upload de fotos
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <i className="ri-close-line"></i>
                Exportar dados
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <i className="ri-close-line"></i>
                Suporte prioritário
              </li>
            </ul>

            <div className="py-2.5 text-center text-gray-400 text-sm font-medium border border-gray-200 rounded-xl bg-gray-50">
              Seu plano atual
            </div>
          </div>

          {/* Premium Plan */}
          <div
            className={`bg-white rounded-2xl border-2 p-6 relative overflow-hidden transition-all ${
              showPremiumBadge ? 'border-orange-400' : 'border-gray-100 hover:border-orange-200'
            }`}
          >
            {/* Popular badge */}
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-4 py-1 transform rotate-45 translate-x-6 translate-y-2">
              Popular
            </div>

            {showPremiumBadge && (
              <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                ★ Plano atual
              </span>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{PLANS.premium.label}</h2>
            </div>

            <div className="mt-2 mb-1">
              <span className="text-3xl font-bold text-orange-500">{PLANS.premium.priceLabel}</span>
              <span className="text-gray-400 text-sm">/{PLANS.premium.interval}</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mb-6">
              Apenas R$2,50/mês — menos que um café! ☕
            </p>

            <ul className="space-y-3 mb-6">
              {PLANS.premium.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="ri-check-line text-orange-500"></i>
                  <strong>{feature}</strong>
                </li>
              ))}
            </ul>

            {showPremiumBadge ? (
              <div className="py-2.5 text-center text-orange-500 text-sm font-bold border-2 border-orange-200 rounded-xl bg-orange-50">
                ★ Você é Premium!
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Processando...
                    </>
                  ) : (
                    <>
                      <i className="ri-credit-card-line"></i>
                      Assinar com Cartão
                    </>
                  )}
                </button>

                <button
                  onClick={handleWhatsAppUpgrade}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="ri-whatsapp-line"></i>
                  Assinar via PIX
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comparison table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Comparação detalhada</h3>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="grid grid-cols-3 px-6 py-3 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500">Recurso</span>
              <span className="text-xs font-semibold text-gray-500 text-center">Grátis</span>
              <span className="text-xs font-semibold text-orange-500 text-center">Premium</span>
            </div>
            {PLAN_COMPARISON.map((feature) => (
              <div key={feature.label} className="grid grid-cols-3 px-6 py-3 items-center">
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  <i className={`${feature.icon} text-gray-400 text-sm`}></i>
                  {feature.label}
                </span>
                <span
                  className={`text-sm text-center ${
                    feature.free === false ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {typeof feature.free === 'boolean' ? (
                    feature.free ? (
                      <i className="ri-check-line text-emerald-500"></i>
                    ) : (
                      <i className="ri-close-line text-gray-300"></i>
                    )
                  ) : (
                    feature.free
                  )}
                </span>
                <span className="text-sm text-center font-medium text-orange-600">
                  {typeof feature.premium === 'boolean' ? (
                    feature.premium ? (
                      <i className="ri-check-line text-orange-500"></i>
                    ) : (
                      <i className="ri-close-line text-gray-300"></i>
                    )
                  ) : (
                    feature.premium
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works - para usuários free */}
        {!showPremiumBadge && (
          <div className="mt-8 bg-orange-50 rounded-2xl p-6 border border-orange-100">
            <h3 className="font-bold text-gray-800 mb-4">
              <i className="ri-question-line mr-1 text-orange-500"></i>
              Como funciona a assinatura?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <p>Clique em "Assinar com Cartão" e preencha seus dados no Stripe (100% seguro)</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <p>Pagamento via cartão de crédito. Seu plano é ativado instantaneamente!</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  3
                </span>
                <p>Cancele quando quiser pelo e-mail 0pet0vida0@gmail.com</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-orange-200 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <i className="ri-shield-check-line text-emerald-500"></i>
                <span>Pagamento 100% seguro via Stripe</span>
              </div>
              <div className="flex items-center gap-1">
                <i className="ri-lock-line text-emerald-500"></i>
                <span>Seus dados são protegidos</span>
              </div>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-8">
          <h3 className="font-bold text-gray-800 mb-4">Dúvidas frequentes</h3>
          <div className="space-y-3">
            <details className="bg-white rounded-xl border border-gray-100 p-4 group">
              <summary className="font-medium text-gray-700 cursor-pointer flex items-center justify-between">
                Posso cancelar a qualquer momento?
                <i className="ri-arrow-down-s-line text-gray-400 group-open:rotate-180 transition-transform"></i>
              </summary>
              <p className="mt-2 text-sm text-gray-600">
                Sim! Você pode cancelar sua assinatura a qualquer momento pelo e-mail{' '}
                <a href="mailto:0pet0vida0@gmail.com" className="text-emerald-600 hover:underline">
                  0pet0vida0@gmail.com
                </a>
                . Você continuará com acesso até o fim do período pago.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-gray-100 p-4 group">
              <summary className="font-medium text-gray-700 cursor-pointer flex items-center justify-between">
                Como funciona o pagamento?
                <i className="ri-arrow-down-s-line text-gray-400 group-open:rotate-180 transition-transform"></i>
              </summary>
              <p className="mt-2 text-sm text-gray-600">
                O pagamento é realizado via Stripe, uma das maiores plataformas de pagamento do mundo.
                Aceitamos cartão de crédito das principais bandeiras. O valor é cobrado anualmente.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-gray-100 p-4 group">
              <summary className="font-medium text-gray-700 cursor-pointer flex items-center justify-between">
                E se eu tiver outros pets além do limite?
                <i className="ri-arrow-down-s-line text-gray-400 group-open:rotate-180 transition-transform"></i>
              </summary>
              <p className="mt-2 text-sm text-gray-600">
                Se você já tem 3 pets cadastrados no plano Free, você não perde o acesso a eles.
                Basta fazer upgrade para Premium para continuar gerenciando todos.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
