import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useApp } from '@/contexts/AppContext';
import SeoJsonLd from '@/components/feature/SeoJsonLd';

const features = [
  {
    icon: 'ri-heart-2-line',
    title: 'Cadastro de Pets',
    desc: 'Registre todos os seus animais com foto, raça, idade, peso e muito mais em um perfil completo.',
  },
  {
    icon: 'ri-alarm-line',
    title: 'Lembretes Inteligentes',
    desc: 'Nunca perca uma vacina, consulta ou medicamento. Configure alertas personalizados para cada pet.',
  },
  {
    icon: 'ri-heart-pulse-line',
    title: 'Histórico de Saúde',
    desc: 'Acompanhe consultas, exames, vacinas e o peso dos seus pets ao longo do tempo.',
  },
  {
    icon: 'ri-layout-grid-line',
    title: 'Dashboard Completo',
    desc: 'Visualize tudo em um só lugar: pets, próximos eventos, saúde e muito mais.',
  },
];

const steps = [
  { num: '01', title: 'Crie sua conta', desc: 'Cadastro rápido e gratuito em menos de 1 minuto.' },
  { num: '02', title: 'Adicione seus pets', desc: 'Registre nome, raça, foto e informações de cada pet.' },
  { num: '03', title: 'Configure lembretes', desc: 'Defina datas de vacinas, consultas e medicamentos.' },
  { num: '04', title: 'Acompanhe a saúde', desc: 'Mantenha o histórico completo e nunca perca nada.' },
];

const testimonials = [
  {
    name: 'Ana Rodrigues',
    pet: 'Tutora do Bolt e da Mel',
    text: 'O PetVida transformou como cuido dos meus dois cachorros. Nunca mais esqueci uma vacina!',
    avatar: 'A',
  },
  {
    name: 'Carlos Mendes',
    pet: 'Tutor da Mimi',
    text: 'Minha gata Mimi tem 12 anos e agora tenho todo o histórico dela organizado. Incrível!',
    avatar: 'C',
  },
  {
    name: 'Juliana Santos',
    pet: 'Tutora do Rex e Totó',
    text: 'Interface linda, fácil de usar. Recomendo para todos que amam seus pets!',
    avatar: 'J',
  },
];

const showcaseScreens = [
  { img: '/images/screen-vacinas.png', title: 'Vacinas sempre em dia', desc: 'Controle completo de vacinação com calendário e status de cada dose.' },
  { img: '/images/screen-agenda.png', title: 'Agenda inteligente', desc: 'Nunca perca um compromisso. Banho, tosa, veterinário — tudo organizado.' },
  { img: '/images/screen-nutricao.png', title: 'Nutrição equilibrada', desc: 'Controle a alimentação diária com refeições, quantidades e horários.' },
  { img: '/images/screen-perfil.png', title: 'Perfil completo', desc: 'Todas as informações do seu pet em um só lugar — raça, peso, microchip e mais.' },
];

export default function HomePage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const siteUrl = import.meta.env.VITE_SITE_URL as string || 'https://petvida.net.br';

  const webAppSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PetVida',
    url: siteUrl,
    description: 'Aplicativo completo para tutores gerenciarem saúde, vacinas, consultas e lembretes dos seus pets.',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    inLanguage: 'pt-BR',
    offers: [
      { '@type': 'Offer', name: 'Plano Grátis', price: '0', priceCurrency: 'BRL' },
      { '@type': 'Offer', name: 'Plano Premium', price: '29.99', priceCurrency: 'BRL', billingIncrement: 'P1Y' },
    ],
  }), [siteUrl]);

  const organizationSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PetVida',
    url: siteUrl,
    logo: `${siteUrl}/images/logo-petvida.jpeg`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+55-85-98743-6263',
      contactType: 'customer support',
      availableLanguage: 'Portuguese',
    },
  }), [siteUrl]);

  const webSiteSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PetVida',
    url: siteUrl,
    description: 'Aplicativo completo para tutores gerenciarem saúde, vacinas, consultas e lembretes dos seus pets.',
    inLanguage: 'pt-BR',
    publisher: { '@type': 'Organization', name: 'PetVida', url: siteUrl },
  }), [siteUrl]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (currentUser) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <SeoJsonLd id="ld-webapp" schema={webAppSchema} />
      <SeoJsonLd id="ld-org" schema={organizationSchema} />
      <SeoJsonLd id="ld-website" schema={webSiteSchema} />

      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white border-b border-gray-100 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/images/logo-petvida.jpeg" alt="PetVida" className="w-9 h-9 rounded-xl object-contain" />
            <span className={`font-bold text-lg tracking-tight ${scrolled ? 'text-gray-800' : 'text-white'}`}>PetVida</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-orange-600' : 'text-white/80 hover:text-white'}`}>Funcionalidades</a>
            <a href="#showcase" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-orange-600' : 'text-white/80 hover:text-white'}`}>Recursos</a>
            <a href="#how" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-orange-600' : 'text-white/80 hover:text-white'}`}>Como funciona</a>
            <a href="#pricing" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-orange-600' : 'text-white/80 hover:text-white'}`}>Planos</a>
            <Link to="/faq" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-orange-600' : 'text-white/80 hover:text-white'}`}>FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/register" className={`text-sm font-medium px-4 py-2 rounded-full transition-colors whitespace-nowrap cursor-pointer ${scrolled ? 'text-gray-600 hover:text-orange-600' : 'text-white/80 hover:text-white'}`}>
              Entrar
            </Link>
            <Link to="/register" className="text-sm font-semibold px-5 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1400&h=900&fit=crop"
            alt="Pets felizes"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                <i className="ri-shield-check-line text-orange-400 text-sm"></i>
                <span className="text-white/90 text-sm font-medium">100% Gratuito para você</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                O melhor cuidado<br />para quem você<br />
                <span className="text-orange-400">mais ama</span>
              </h1>
              <p className="text-lg text-white/85 mb-10 max-w-xl leading-relaxed">
                Gerencie vacinas, consultas, nutrição e a saúde completa dos seus pets em um só lugar. Simples, bonito e gratuito.
              </p>
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
                <Link to="/register" className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-all text-base cursor-pointer whitespace-nowrap shadow-lg hover:shadow-xl">
                  Começar gratuitamente
                </Link>
                <a href="#showcase" className="px-8 py-4 bg-white/15 backdrop-blur-sm hover:bg-white/25 border border-white/30 text-white font-semibold rounded-full transition-all text-base cursor-pointer whitespace-nowrap">
                  Ver recursos
                </a>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-8 mt-12">
                {[['500+', 'Tutores'], ['1.200+', 'Pets'], ['98%', 'Satisfação']].map(([num, label]) => (
                  <div key={label} className="text-center">
                    <p className="text-2xl font-bold text-white">{num}</p>
                    <p className="text-white/60 text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex justify-center">
              <div className="relative w-56 md:w-64">
                <img src="/images/screen-download.png" alt="PetVida App" className="w-full rounded-3xl shadow-2xl" />
                <div className="absolute -bottom-4 -left-12 w-44 hidden md:block">
                  <img src="/images/screen-vacinas.png" alt="Vacinas" className="w-full rounded-2xl shadow-xl opacity-90 -rotate-6" />
                </div>
                <div className="absolute -top-4 -right-12 w-44 hidden md:block">
                  <img src="/images/screen-agenda.png" alt="Agenda" className="w-full rounded-2xl shadow-xl opacity-90 rotate-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <a href="#features" className="absolute bottom-8 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center text-white/60 animate-bounce cursor-pointer">
          <i className="ri-arrow-down-line text-xl"></i>
        </a>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-orange-600 font-semibold text-sm uppercase tracking-wider">Funcionalidades</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-3 mb-4">Tudo que seus pets precisam</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Uma plataforma completa para garantir o bem-estar e a saúde dos seus animais de estimação.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                  <i className={`${f.icon} text-orange-600 text-xl`}></i>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase with screenshots */}
      <section id="showcase" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-orange-600 font-semibold text-sm uppercase tracking-wider">Recursos</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-3 mb-4">Conheça o PetVida por dentro</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Veja como é fácil e intuitivo cuidar dos seus pets com o PetVida.</p>
          </div>
          <div className="space-y-24">
            {showcaseScreens.map((screen, i) => (
              <div key={screen.title} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:direction-rtl' : ''}`}>
                <div className={`${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">{screen.title}</h3>
                  <p className="text-gray-500 leading-relaxed mb-6">{screen.desc}</p>
                  <Link to="/register" className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors cursor-pointer">
                    Experimentar grátis <i className="ri-arrow-right-line"></i>
                  </Link>
                </div>
                <div className={`flex justify-center ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="w-56 md:w-64 transform hover:scale-105 transition-transform duration-500">
                    <img src={screen.img} alt={screen.title} className="w-full rounded-3xl shadow-2xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources overview image */}
      <section className="py-24 bg-gradient-to-br from-teal-600 to-emerald-700 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="w-56 md:w-64">
                <img src="/images/screen-recursos.png" alt="Recursos PetVida" className="w-full rounded-3xl shadow-2xl" />
              </div>
            </div>
            <div className="text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Cuide com amor e tecnologia</h2>
              <p className="text-emerald-100 leading-relaxed mb-8">
                Tudo que seu pet precisa em um só lugar. Saúde completa, controle de vacinas, agenda inteligente, nutrição, gráficos de peso e suporte para múltiplos pets.
              </p>
              <ul className="space-y-3 mb-8">
                {['Saúde completa — histórico, consultas e exames', 'Controle de vacinas — lembretes e calendário', 'Agenda inteligente — banho, tosa, veterinário', 'Nutrição — refeições e hidratação', 'Gráficos de peso — evolução visual', 'Múltiplos pets — todos em um só lugar'].map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <i className="ri-check-line text-emerald-300 text-lg"></i>
                    <span className="text-white/90 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-emerald-700 font-bold rounded-full hover:bg-emerald-50 transition-colors cursor-pointer whitespace-nowrap shadow-lg">
                Baixe grátis <i className="ri-arrow-right-line"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-orange-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-orange-600 font-semibold text-sm uppercase tracking-wider">Como funciona</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-3 mb-4">Simples e rápido de começar</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Em apenas 4 passos você já estará organizando tudo para seus pets.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-orange-200 z-0" style={{ width: 'calc(100% - 2rem)', left: 'calc(50% + 2rem)' }}></div>
                )}
                <div className="bg-white rounded-2xl p-6 border border-orange-100 relative z-10 text-center hover:shadow-lg transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-orange-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-orange-600 font-semibold text-sm uppercase tracking-wider">Depoimentos</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-3 mb-4">O que dizem nossos tutores</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <i key={i} className="ri-star-fill text-amber-400 text-sm"></i>)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-semibold">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.pet}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-orange-600 font-semibold text-sm uppercase tracking-wider">Planos</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-3 mb-4">Simples e transparente</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Comece grátis e faça upgrade quando precisar de mais!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Plano Grátis */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 flex flex-col hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                  <i className="ri-heart-2-line text-orange-600 text-xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">Grátis</h3>
                <p className="text-gray-500 text-sm">Perfeito para começar a cuidar do seu pet.</p>
              </div>
              <div className="mb-8">
                <div className="flex items-end gap-1">
                  <span className="text-gray-400 text-lg font-medium">R$</span>
                  <span className="text-5xl font-bold text-gray-800">0</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">para sempre</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Até 3 pets cadastrados', '5 lembretes por pet', 'Histórico de saúde', 'Dashboard personalizado'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <i className="ri-check-line text-orange-500 text-base"></i>
                    <span className="text-gray-600 text-sm">{item}</span>
                  </li>
                ))}
                {['Upload de fotos', 'Exportar dados', 'Suporte prioritário'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <i className="ri-close-line text-gray-300 text-base"></i>
                    <span className="text-gray-300 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-center hover:border-orange-400 hover:text-orange-600 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2">
                Começar grátis
              </Link>
            </div>

            {/* Plano Premium */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-8 flex flex-col relative overflow-hidden hover:shadow-xl transition-shadow">
              <div className="absolute top-5 right-5 bg-white text-orange-600 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                ★ Mais popular
              </div>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <i className="ri-vip-crown-line text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Premium</h3>
                <p className="text-orange-100 text-sm">Tudo liberado para quem leva o cuidado a sério.</p>
              </div>
              <div className="mb-8">
                <div className="flex items-end gap-1">
                  <span className="text-orange-200 text-lg font-medium">R$</span>
                  <span className="text-5xl font-bold text-white">29</span>
                  <span className="text-5xl font-bold text-white">,99</span>
                </div>
                <p className="text-orange-200 text-sm mt-1">por ano — apenas R$2,50/mês</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Pets ilimitados', 'Lembretes ilimitados', 'Histórico completo', 'Upload de fotos', 'Exportar dados', 'Suporte prioritário', 'Badge Premium'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <i className="ri-check-line text-white text-base"></i>
                    <span className="text-orange-50 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="w-full py-3.5 rounded-2xl bg-white text-orange-600 font-bold text-center hover:bg-orange-50 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2">
                Assinar Premium
              </Link>
            </div>
          </div>
          <p className="text-center text-gray-400 text-sm mt-6">
            Comece grátis, faça upgrade quando quiser. Sem taxas escondidas.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-orange-500 to-red-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 text-8xl">🐾</div>
          <div className="absolute bottom-10 right-20 text-8xl">🐾</div>
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <img src="/logo.png" alt="PetVida" className="w-20 h-20 rounded-2xl mx-auto mb-6 shadow-lg" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">PetVida</h2>
          <p className="text-orange-100 text-lg mb-2">Cuidando de quem você ama</p>
          <div className="flex flex-wrap justify-center gap-3 my-8">
            {['Saúde e histórico completo', 'Vacinas sempre em dia', 'Agenda inteligente', 'Nutrição equilibrada', '100% Gratuito'].map(item => (
              <span key={item} className="bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full border border-white/20">
                ✓ {item}
              </span>
            ))}
          </div>
          <Link to="/register" className="inline-flex items-center gap-2 px-10 py-4 bg-white text-orange-600 font-bold rounded-full transition-colors text-lg cursor-pointer whitespace-nowrap hover:bg-orange-50 shadow-xl">
            Baixe Agora!
            <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PetVida" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-bold text-white">PetVida</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a href="https://wa.me/5585987436263?text=Ol%C3%A1%2C+tenho+uma+d%C3%BAvida+sobre+o+PetVida!" target="_blank" rel="nofollow noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors whitespace-nowrap cursor-pointer">
              <i className="ri-whatsapp-line"></i> (85) 98743-6263
            </a>
            <a href="mailto:0pet0vida0@gmail.com" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors whitespace-nowrap cursor-pointer">
              <i className="ri-mail-line"></i> 0pet0vida0@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</Link>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacidade</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Termos</a>
          </div>
        </div>
        <p className="text-center text-gray-600 text-xs mt-6">© 2026 PetVida. Feito com amor para os pets. 🐾</p>
      </footer>
    </div>
  );
}
