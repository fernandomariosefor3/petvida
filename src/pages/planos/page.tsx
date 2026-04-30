import { useApp } from '@/contexts/AppContext';
import { PLAN_LIMITS } from '@/types';

export default function PlanosPage() {
  const { currentUser, isPremium, pets } = useApp();
  if (!currentUser) return null;

  const features = [
    { label: 'Cadastro de pets', free: 'Até 3 pets', premium: 'Ilimitado', icon: 'ri-heart-2-line' },
    { label: 'Lembretes por pet', free: 'Até 5 por pet', premium: 'Ilimitado', icon: 'ri-alarm-line' },
    { label: 'Histórico de saúde', free: '✓', premium: '✓', icon: 'ri-heart-pulse-line' },
    { label: 'Upload de fotos', free: '✗', premium: '✓', icon: 'ri-camera-line' },
    { label: 'Exportar dados', free: '✗', premium: '✓', icon: 'ri-download-line' },
    { label: 'Badge Premium', free: '✗', premium: '✓', icon: 'ri-vip-crown-line' },
    { label: 'Suporte prioritário', free: '✗', premium: '✓', icon: 'ri-customer-service-line' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Escolha seu plano</h1>
          <p className="text-gray-500 text-sm mt-1">Cuide dos seus pets com o plano ideal para você</p>
        </div>

        {/* Current plan status */}
        {isPremium && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="ri-vip-crown-line text-white text-2xl"></i>
            </div>
            <div>
              <p className="text-white font-bold text-lg">Você é Premium! ★</p>
              <p className="text-orange-100 text-sm">
                Plano ativo até {currentUser.planExpiresAt ? new Date(currentUser.planExpiresAt).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Free */}
          <div className={`bg-white rounded-2xl border-2 p-6 ${!isPremium ? 'border-emerald-400' : 'border-gray-100'}`}>
            {!isPremium && (
              <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-4">Plano atual</span>
            )}
            <h2 className="text-xl font-bold text-gray-800">Grátis</h2>
            <div className="mt-2 mb-6">
              <span className="text-3xl font-bold text-gray-800">R$0</span>
              <span className="text-gray-400 text-sm">/para sempre</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600"><i className="ri-check-line text-emerald-500"></i>Até 3 pets</li>
              <li className="flex items-center gap-2 text-sm text-gray-600"><i className="ri-check-line text-emerald-500"></i>5 lembretes por pet</li>
              <li className="flex items-center gap-2 text-sm text-gray-600"><i className="ri-check-line text-emerald-500"></i>Histórico de saúde</li>
              <li className="flex items-center gap-2 text-sm text-gray-300"><i className="ri-close-line"></i>Upload de fotos</li>
              <li className="flex items-center gap-2 text-sm text-gray-300"><i className="ri-close-line"></i>Exportar dados</li>
              <li className="flex items-center gap-2 text-sm text-gray-300"><i className="ri-close-line"></i>Suporte prioritário</li>
            </ul>
            {!isPremium && (
              <div className="py-2.5 text-center text-gray-400 text-sm font-medium border border-gray-200 rounded-xl">Seu plano atual</div>
            )}
          </div>

          {/* Premium */}
          <div className={`bg-white rounded-2xl border-2 p-6 relative overflow-hidden ${isPremium ? 'border-orange-400' : 'border-gray-100'}`}>
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-4 py-1 transform rotate-45 translate-x-6 translate-y-2">Popular</div>
            {isPremium && (
              <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full mb-4">★ Plano atual</span>
            )}
            <h2 className="text-xl font-bold text-gray-800">Premium</h2>
            <div className="mt-2 mb-1">
              <span className="text-3xl font-bold text-orange-500">R$29,99</span>
              <span className="text-gray-400 text-sm">/ano</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mb-6">Apenas R$2,50/mês — menos que um café! ☕</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600"><i className="ri-check-line text-orange-500"></i><strong>Pets ilimitados</strong></li>
              <li className="flex items-center gap-2 text-sm text-gray-600"><i className="ri-check-line text-orange-500"></i><strong>Lembretes ilimitados</strong></li>
              <li className="flex items-center gap-2 text-sm text-gray-600"><i className="ri-check-line text-orange-500"></i>Histórico de saúde</li>
              <li className="flex items-center gap-2 text-sm text-gray-600"><i className="ri-check-line text-orange-500"></i>Upload de fotos dos pets</li>
              <li className="flex items-center gap-2 text-sm text-gray-600"><i className="ri-check-line text-orange-500"></i>Exportar dados</li>
              <li className="flex items-center gap-2 text-sm text-gray-600"><i className="ri-check-line text-orange-500"></i>Suporte prioritário</li>
            </ul>
            {!isPremium ? (
              <a
                href="https://wa.me/5585987436263?text=Olá! Quero assinar o plano Premium do PetVida (R$29,99/ano). Meu e-mail de cadastro é: "
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 text-center bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                <i className="ri-whatsapp-line mr-1"></i> Assinar via WhatsApp
              </a>
            ) : (
              <div className="py-2.5 text-center text-orange-500 text-sm font-bold border-2 border-orange-200 rounded-xl bg-orange-50">★ Você é Premium!</div>
            )}
          </div>
        </div>

        {/* Comparison table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Comparação detalhada</h3>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="grid grid-cols-3 px-6 py-3 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500">Recurso</span>
              <span className="text-xs font-semibold text-gray-500 text-center">Grátis</span>
              <span className="text-xs font-semibold text-orange-500 text-center">Premium</span>
            </div>
            {features.map(f => (
              <div key={f.label} className="grid grid-cols-3 px-6 py-3 items-center">
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  <i className={`${f.icon} text-gray-400 text-sm`}></i>{f.label}
                </span>
                <span className={`text-sm text-center ${f.free === '✗' ? 'text-gray-300' : 'text-gray-600'}`}>{f.free}</span>
                <span className={`text-sm text-center font-medium ${f.premium === '✓' ? 'text-orange-500' : 'text-orange-600'}`}>{f.premium}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        {!isPremium && (
          <div className="mt-8 bg-orange-50 rounded-2xl p-6 border border-orange-100">
            <h3 className="font-bold text-gray-800 mb-4"><i className="ri-question-line mr-1 text-orange-500"></i>Como assinar o Premium?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">1</span>
                <p>Clique no botão "Assinar via WhatsApp" acima</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">2</span>
                <p>Envie seu e-mail de cadastro e realize o pagamento via PIX (R$29,99)</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">3</span>
                <p>Seu plano será ativado em até 1 hora e você terá acesso a todos os recursos!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
