import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { PLANS } from '@/lib/plans';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, refreshProfile, isPremium } = useApp();
  
  const sessionId = searchParams.get('session_id');
  const planParam = searchParams.get('plan') || 'premium';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Verificar status do pagamento e atualizar perfil
  useEffect(() => {
    async function verifyAndUpdate() {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        // Aguardar um momento para o webhook processar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Atualizar perfil para pegar status mais recente
        await refreshProfile();
        
        // Se o usuário já é premium, não precisa verificar sessão
        if (isPremium) {
          setLoading(false);
          setTimeout(() => setVisible(true), 80);
          return;
        }

        // Se tem sessionId, verificar no Stripe (opcional)
        if (sessionId) {
          const response = await fetch(`/.netlify/functions/get-checkout-session?session_id=${sessionId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.paymentStatus === 'paid') {
              await refreshProfile();
            }
          }
        }
        
        setLoading(false);
        setTimeout(() => setVisible(true), 80);
      } catch (err) {
        console.error('Erro ao verificar pagamento:', err);
        setError('Erro ao verificar pagamento. Entre em contato com suporte.');
        setLoading(false);
        setTimeout(() => setVisible(true), 80);
      }
    }

    verifyAndUpdate();
  }, [currentUser, sessionId, refreshProfile, isPremium, navigate]);

  const plan = PLANS[planParam as keyof typeof PLANS] || PLANS.premium;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      {/* Navbar simples */}
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
          className={`w-full max-w-2xl transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Card principal */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            {/* Topo verde com ícone */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-10 text-center">
              <div className="relative inline-flex items-center justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  {loading ? (
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                      <i className="ri-loader-4-line text-emerald-500 text-3xl animate-spin"></i>
                    </div>
                  ) : isPremium ? (
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                      <i className="ri-checkbox-circle-fill text-emerald-500 text-4xl"></i>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                      <i className="ri-error-warning-line text-orange-500 text-3xl"></i>
                    </div>
                  )}
                </div>
                {/* Partículas decorativas */}
                {!loading && isPremium && (
                  <>
                    <span className="absolute -top-1 -right-1 text-amber-300 text-2xl animate-bounce">✦</span>
                    <span className="absolute -bottom-1 -left-1 text-white/60 text-lg animate-pulse">✦</span>
                  </>
                )}
              </div>

              {loading ? (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">Processando pagamento...</h1>
                  <p className="text-emerald-100 text-base">
                    Por favor, aguarde enquanto confirmamos sua assinatura.
                  </p>
                </>
              ) : isPremium ? (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">Pagamento confirmado!</h1>
                  <p className="text-emerald-100 text-base">
                    Seu <strong className="text-white">{plan.name}</strong> está ativo — bem-vindo ao PetVida Premium!
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">Atenção</h1>
                  <p className="text-emerald-100 text-base">
                    Não conseguimos confirmar seu pagamento automaticamente.
                  </p>
                </>
              )}

              {/* Badge do plano */}
              {!loading && (
                <div className="inline-flex items-center gap-2 mt-5 bg-white/15 border border-white/25 rounded-full px-5 py-2">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-vip-crown-line text-white text-sm"></i>
                  </div>
                  <span className="text-white font-semibold text-sm">{plan.name}</span>
                  <span className="text-emerald-100 text-sm">— {plan.priceLabel}</span>
                </div>
              )}
            </div>

            {/* Corpo */}
            <div className="px-8 py-8">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 text-gray-500">
                    <i className="ri-time-line"></i>
                    <span>Confirmando pagamento com Stripe...</span>
                  </div>
                </div>
              ) : isPremium ? (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-map-pin-2-line text-emerald-500"></i>
                    </div>
                    <h2 className="font-bold text-gray-800 text-lg">O que você ganhou</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-emerald-50 rounded-xl p-3">
                        <i className="ri-check-line text-emerald-500"></i>
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Info adicional */}
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
                    <div className="w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <i className="ri-information-line text-amber-500"></i>
                    </div>
                    <p className="text-amber-800 text-sm leading-relaxed">
                      Um <strong>recibo do pagamento</strong> foi enviado para o seu e-mail pela Stripe. Guarde-o como comprovante da assinatura.
                    </p>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/dashboard"
                      className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-center transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      <i className="ri-dashboard-line"></i>
                      Ir para Dashboard
                    </Link>
                    <Link
                      to="/pets"
                      className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl text-center transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      <i className="ri-heart-2-line"></i>
                      Cadastrar Pets
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-error-warning-line text-orange-500"></i>
                    </div>
                    <h2 className="font-bold text-gray-800 text-lg">Precisa de ajuda?</h2>
                  </div>

                  <p className="text-gray-600 mb-6">
                    {error || 'Se você já realizou o pagamento, entre em contato com nosso suporte.'}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="mailto:0pet0vida0@gmail.com"
                      className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-center transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      <i className="ri-mail-line"></i>
                      Contatar Suporte
                    </a>
                    <Link
                      to="/planos"
                      className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl text-center transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      <i className="ri-arrow-left-line"></i>
                      Voltar aos Planos
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer info */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              Dúvidas?{' '}
              <a
                href="mailto:0pet0vida0@gmail.com"
                className="text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
              >
                0pet0vida0@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
