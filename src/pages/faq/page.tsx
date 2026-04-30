import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SeoJsonLd from '@/components/feature/SeoJsonLd';

const CONTACT_EMAIL = '0pet0vida0@gmail.com';
const WHATSAPP_NUMBER = '5585987436263';
const WHATSAPP_DISPLAY = '(85) 98743-6263';

const categories = [
  {
    id: 'plans',
    label: 'Planos e pagamento',
    icon: 'ri-price-tag-3-line',
    questions: [
      {
        q: 'Qual a diferença entre o plano mensal e o anual?',
        a: 'Os dois planos dão acesso completo a todas as funcionalidades do PetVida. A diferença é só no valor: no plano mensal você paga R$ 9,99 por mês. No plano anual, você paga R$ 78,99 por ano — o equivalente a R$ 6,58/mês, economizando cerca de 34% em comparação ao mensal.',
      },
      {
        q: 'Posso cancelar a qualquer momento?',
        a: 'Sim! Não há fidelidade nem multa. No plano mensal, o cancelamento é válido a partir do próximo ciclo. No plano anual, o acesso permanece ativo até o fim do período já pago.',
      },
      {
        q: 'Quais formas de pagamento são aceitas?',
        a: 'Aceitamos cartão de crédito, débito e Pix. O pagamento é processado de forma segura e nenhum dado do cartão é armazenado em nossos servidores.',
      },
      {
        q: 'Existe período de teste gratuito?',
        a: 'Sim! Você pode criar sua conta e explorar o PetVida gratuitamente. O plano pago é necessário para ter acesso ilimitado a todos os recursos.',
      },
      {
        q: 'Posso mudar do plano mensal para o anual depois?',
        a: 'Claro! Você pode fazer o upgrade a qualquer momento. O valor já pago no mês atual é descontado proporcionalmente no plano anual.',
      },
      {
        q: 'Recebo nota fiscal ou comprovante?',
        a: 'Sim, um recibo de pagamento é enviado automaticamente para o e-mail cadastrado a cada cobrança.',
      },
    ],
  },
  {
    id: 'app',
    label: 'Sobre o aplicativo',
    icon: 'ri-heart-2-line',
    questions: [
      {
        q: 'Quantos pets posso cadastrar?',
        a: 'Tanto no plano mensal quanto no anual, o cadastro de pets é ilimitado. Sem restrição de quantidade!',
      },
      {
        q: 'Quais tipos de animais posso registrar?',
        a: 'O PetVida suporta cães, gatos e outros pets. Você pode preencher livremente a espécie e raça de qualquer animal.',
      },
      {
        q: 'Como funcionam os lembretes?',
        a: 'Você cria lembretes com data e descrição para cada pet — vacinas, consultas, banho, medicamentos, etc. O sistema marca automaticamente como atrasado quando a data passa, e você recebe alertas visuais no app.',
      },
      {
        q: 'O histórico de saúde fica salvo para sempre?',
        a: 'Sim! Todos os registros de saúde ficam armazenados com segurança na nuvem enquanto sua assinatura estiver ativa. Não há limite de registros por pet.',
      },
      {
        q: 'Posso usar em mais de um dispositivo?',
        a: 'Sim! O PetVida é um aplicativo web que funciona em qualquer navegador — computador, celular ou tablet. Basta fazer login com sua conta.',
      },
      {
        q: 'Como adiciono um pet?',
        a: 'Após criar sua conta e acessar o dashboard, clique em "Meus Pets" no menu lateral e depois em "Adicionar pet". Preencha as informações do seu animal, adicione uma foto e pronto!',
      },
    ],
  },
  {
    id: 'account',
    label: 'Conta e segurança',
    icon: 'ri-shield-check-line',
    questions: [
      {
        q: 'Meus dados estão seguros?',
        a: 'Sim! O PetVida usa criptografia de ponta a ponta e armazena os dados em servidores seguros. Nunca compartilhamos suas informações com terceiros.',
      },
      {
        q: 'Esqueci minha senha. O que fazer?',
        a: 'Na tela de login, clique em "Esqueci minha senha". Você receberá um e-mail com as instruções para redefinir. Caso não encontre, verifique a caixa de spam.',
      },
      {
        q: 'Posso excluir minha conta?',
        a: `Sim. Para solicitar a exclusão da sua conta e de todos os dados associados, entre em contato pelo e-mail ${CONTACT_EMAIL}. Processamos a solicitação em até 5 dias úteis.`,
      },
      {
        q: 'Como altero o e-mail da minha conta?',
        a: `Para alterar seu e-mail de cadastro, envie uma solicitação para ${CONTACT_EMAIL} com o assunto "Alteração de e-mail". Nossa equipe responderá em até 2 dias úteis.`,
      },
    ],
  },
];

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-gray-100 rounded-2xl overflow-hidden transition-all ${open ? 'bg-emerald-50 border-emerald-100' : 'bg-white hover:border-gray-200'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
      >
        <span className={`text-sm font-semibold leading-snug ${open ? 'text-emerald-700' : 'text-gray-800'}`}>{question}</span>
        <div className={`w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition-all ${open ? 'bg-emerald-500 text-white rotate-45' : 'bg-gray-100 text-gray-500'}`}>
          <i className="ri-add-line text-sm"></i>
        </div>
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-gray-600 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState('plans');
  const [scrolled, setScrolled] = useState(false);

  const siteUrl = import.meta.env.VITE_SITE_URL as string || 'https://petvida.net.br';

  const allQuestions = useMemo(() =>
    categories.flatMap(cat => cat.questions), []);

  const faqSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${siteUrl}/faq`,
    name: 'Perguntas Frequentes — PetVida',
    mainEntity: allQuestions.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }), [siteUrl, allQuestions]);

  const webPageSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${siteUrl}/faq`,
    url: `${siteUrl}/faq`,
    name: 'Perguntas Frequentes — PetVida',
    description: 'Encontre respostas sobre planos, pagamento, funcionalidades e segurança do PetVida, o app de saúde para pets.',
    inLanguage: 'pt-BR',
    isPartOf: {
      '@type': 'WebSite',
      name: 'PetVida',
      url: siteUrl,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Início',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'FAQ',
          item: `${siteUrl}/faq`,
        },
      ],
    },
  }), [siteUrl]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const current = categories.find(c => c.id === activeCategory)!;

  return (
    <div className="min-h-screen bg-white font-sans">
      <SeoJsonLd id="ld-faq" schema={faqSchema} />
      <SeoJsonLd id="ld-faq-page" schema={webPageSchema} />

      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white border-b border-gray-100' : 'bg-white border-b border-gray-100'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/logo.png" alt="PetVida" className="w-8 h-8 object-contain" />
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-800">PetVida</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/#features" className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors">Funcionalidades</Link>
            <Link to="/#pricing" className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors">Planos</Link>
            <Link to="/faq" className="text-sm font-medium text-emerald-600">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/register" className="text-sm font-medium px-4 py-2 rounded-full text-gray-600 hover:text-emerald-600 transition-colors whitespace-nowrap cursor-pointer">
              Entrar
            </Link>
            <Link to="/register" className="text-sm font-semibold px-5 py-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors whitespace-nowrap cursor-pointer">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <i className="ri-question-answer-line text-emerald-600 text-2xl"></i>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Perguntas frequentes</h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Encontre respostas rápidas sobre os planos, o aplicativo e sua conta.
            Não achou o que procura? Fala com a gente!
          </p>
        </div>
      </section>

      {/* Categories + FAQ */}
      <section className="py-12 pb-24">
        <div className="max-w-4xl mx-auto px-6">

          {/* Category tabs */}
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className={`${cat.icon} text-sm`}></i>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Questions */}
          <div className="space-y-3">
            {current.questions.map(item => (
              <AccordionItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>

          {/* Total count */}
          <p className="text-center text-gray-400 text-xs mt-8">
            {current.questions.length} perguntas nesta categoria
          </p>
        </div>
      </section>

      {/* CTA contact */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <i className="ri-customer-service-2-line text-emerald-600 text-xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Ainda tem dúvidas?</h2>
          <p className="text-gray-500 mb-10 leading-relaxed">
            Nossa equipe está pronta para te ajudar. Fale por WhatsApp ou mande um e-mail!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1%2C+tenho+uma+d%C3%BAvida+sobre+o+PetVida!`}
              target="_blank"
              rel="nofollow noreferrer"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-whatsapp-line text-lg"></i>
              {WHATSAPP_DISPLAY}
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white border border-gray-200 hover:border-emerald-400 text-gray-700 hover:text-emerald-600 font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-mail-line text-lg"></i>
              {CONTACT_EMAIL}
            </a>
          </div>
          <p className="text-gray-400 text-xs mt-6">Atendimento nos dias úteis · WhatsApp e e-mail</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-800 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center">
              <img src="/logo.png" alt="PetVida" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-bold text-white">PetVida</span>
          </div>
          <p className="text-emerald-200 text-sm">© 2026 PetVida Care. Feito com amor para os pets.</p>
          <div className="flex items-center gap-4">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="nofollow noreferrer"
              className="flex items-center gap-1.5 text-emerald-200 hover:text-white text-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-whatsapp-line"></i>
              {WHATSAPP_DISPLAY}
            </a>
            <Link to="/faq" className="text-emerald-200 hover:text-white text-sm transition-colors">FAQ</Link>
            <a href="#" className="text-emerald-200 hover:text-white text-sm transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
