import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const planDetails = {
  monthly: {
    label: 'Plano Mensal',
    price: 'R$9,99/mês',
    icon: 'ri-calendar-line',
  },
  annual: {
    label: 'Plano Anual',
    price: 'R$78,99/ano',
    icon: 'ri-calendar-2-line',
  },
};

const steps = [
  {
    num: '01',
    icon: 'ri-user-add-line',
    title: 'Crie sua conta',
    desc: 'Clique em "Criar minha conta" abaixo, preencha seu e-mail e senha. Leva menos de 1 minuto!',
    highlight: true,
  },
  {
    num: '02',
    icon: 'ri-mail-check-line',
    title: 'Confirme seu e-mail',
    desc: 'Verifique sua caixa de entrada (e spam) pelo e-mail de confirmação do PetVida e clique no link.',
    highlight: false,
  },
  {
    num: '03',
    icon: 'ri-login-circle-line',
    title: 'Faça login',
    desc: 'Após confirmar o e-mail, entre com seus dados e seu plano estará ativo automaticamente.',
    highlight: false,
  },
  {
    num: '04',
    icon: 'ri-heart-2-line',
    title: 'Cadastre seus pets',
    desc: 'Adicione fotos, informações de saúde e configure lembretes pra cada um dos seus animais.',
    highlight: false,
  },
];

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get('plan') as 'monthly' | 'annual' | null;
  const plan = planKey && planDetails[planKey] ? planDetails[planKey] : planDetails.monthly;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      {/* Navbar simples */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="PetVida"
              className="w-7 h-7 object-contain"
            />
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
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                    <i className="ri-checkbox-circle-fill text-emerald-500 text-4xl"></i>
                  </div>
                </div>
                {/* Partículas decorativas */}
                <span className="absolute -top-1 -right-1 text-amber-300 text-2xl animate-bounce">✦</span>
                <span className="absolute -bottom-1 -left-1 text-white/60 text-lg animate-pulse">✦</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Pagamento confirmado!</h1>
              <p className="text-emerald-100 text-base">
                Seu <strong className="text-white">{plan.label}</strong> está ativo — bem-vindo ao PetVida!
              </p>

              {/* Badge do plano */}
              <div className="inline-flex items-center gap-2 mt-5 bg-white/15 border border-white/25 rounded-full px-5 py-2">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className={`${plan.icon} text-white text-sm`}></i>
                </div>
                <span className="text-white font-semibold text-sm">{plan.label}</span>
                <span className="text-emerald-100 text-sm">&mdash; {plan.price}</span>
              </div>
            </div>

            {/* Corpo */}
            <div className="px-8 py-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-map-pin-2-line text-emerald-500"></i>
                </div>
                <h2 className="font-bold text-gray-800 text-lg">Como acessar sua conta</h2>
              </div>

              <div className="space-y-4 mb-8">
                {steps.map((step) => (
                  <div
                    key={step.num}
                    className={`flex gap-4 p-4 rounded-2xl transition-all ${
                      step.highlight
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        step.highlight ? 'bg-emerald-500' : 'bg-white border border-gray-200'
                      }`}
                    >
                      <i
                        className={`${step.icon} text-base ${
                          step.highlight ? 'text-white' : 'text-gray-500'
                        }`}
                      ></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-bold ${
                            step.highlight ? 'text-emerald-600' : 'text-gray-400'
                          }`}
                        >
                          PASSO {step.num}
                        </span>
                        {step.highlight && (
                          <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            Próximo
                          </span>
                        )}
                      </div>
                      <p
                        className={`font-semibold text-sm mb-0.5 ${
                          step.highlight ? 'text-emerald-800' : 'text-gray-700'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p
                        className={`text-xs leading-relaxed ${
                          step.highlight ? 'text-emerald-700' : 'text-gray-500'
                        }`}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info adicional */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
                <div className="w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <i className="ri-information-line text-amber-500"></i>
                </div>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Um <strong>recibo do pagamento</strong> será enviado para o seu e-mail pela Stripe. Guarde-o como comprovante da assinatura.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/register"
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-center transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <i className="ri-user-add-line"></i>
                  Criar minha conta
                </Link>
                <Link
                  to="/"
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl text-center transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <i className="ri-home-4-line"></i>
                  Voltar para o início
                </Link>
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              Precisa de ajuda?{' '}
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
