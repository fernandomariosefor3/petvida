import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type Mode = 'login' | 'register' | 'forgot';

const PawBg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <ellipse cx="6" cy="7" rx="2" ry="2.5"/>
    <ellipse cx="11" cy="5" rx="2" ry="2.5"/>
    <ellipse cx="16" cy="7" rx="2" ry="2.5"/>
    <ellipse cx="18.5" cy="12" rx="1.5" ry="2"/>
    <path d="M12 10c-3.5 0-7 2.5-7 6 0 2.5 2 4 4 4h6c2 0 4-1.5 4-4 0-3.5-3.5-6-7-6z"/>
  </svg>
);

export default function RegistrationPage() {
  const { login, register, resetPassword, firebaseUser } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (firebaseUser) navigate('/dashboard');
  }, [firebaseUser, navigate]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || 'Usuário',
          email: user.email,
          phone: '',
          plan: 'free',
          planExpiresAt: '',
          createdAt: serverTimestamp(),
        });
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user') {
        setError('Não foi possível entrar com o Google. Tente novamente.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await login(email, password);
      if (err) setError(err);
    } else if (mode === 'register') {
      if (password !== confirmPassword) { setError('As senhas não coincidem.'); setLoading(false); return; }
      if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); setLoading(false); return; }
      const { error: err } = await register(name, email, password);
      if (err) setError(err);
    } else if (mode === 'forgot') {
      const { error: err } = await resetPassword(email);
      if (err) { setError(err); }
      else { setSuccess('E-mail enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.'); }
    }
    setLoading(false);
  };

  const switchMode = (m: Mode) => {
    setMode(m); setError(''); setSuccess('');
    setName(''); setEmail(''); setPassword(''); setConfirmPassword('');
  };

  const headings: Record<Mode, { title: string; sub: string; emoji: string }> = {
    login:    { title: 'Bem-vindo(a) de volta!', sub: 'Entre na sua conta para continuar.', emoji: '🐾' },
    register: { title: 'Crie sua conta', sub: 'Cadastre-se gratuitamente e comece agora.', emoji: '🐶' },
    forgot:   { title: 'Esqueci minha senha', sub: 'Digite seu e-mail para receber o link de redefinição.', emoji: '🔑' },
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #f0fdf4 50%, #eff6ff 100%)' }}>

      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=1000&fit=crop"
          alt="Pets felizes"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,46,22,0.65) 0%, rgba(6,78,59,0.45) 50%, rgba(5,46,22,0.75) 100%)' }}></div>

        {/* Floating paws decoration */}
        <div className="absolute top-8 right-8 w-12 h-12 text-white/20 pointer-events-none rotate-12"><PawBg /></div>
        <div className="absolute top-32 left-8 w-8 h-8 text-white/15 pointer-events-none -rotate-12"><PawBg /></div>
        <div className="absolute bottom-32 right-12 w-10 h-10 text-white/20 pointer-events-none rotate-45"><PawBg /></div>
        <div className="absolute bottom-16 left-8 w-6 h-6 text-white/15 pointer-events-none rotate-6"><PawBg /></div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <div className="w-20 h-20 flex items-center justify-center mb-5 rounded-2xl shadow-xl"
            style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
            <span className="text-4xl">🐾</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">PetVida Care</h1>
          <p className="text-white/80 text-base leading-relaxed">
            O lugar certo para cuidar de quem você mais ama. Organize vacinas, consultas e a saúde dos seus pets com carinho.
          </p>
          <div className="flex flex-col gap-3 mt-8 w-full max-w-xs">
            {[
              { icon: '🛡️', text: 'Dados seguros e privados' },
              { icon: '⏰', text: 'Lembretes automáticos' },
              { icon: '💊', text: 'Histórico completo de saúde' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <span className="text-lg">{item.icon}</span>
                <span className="text-white/90 text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-xs mt-10">🐾 Mais de 1.000 pets cuidados</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
              <span className="text-2xl">🐾</span>
            </div>
            <span className="text-xl font-bold text-gray-800">PetVida</span>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-orange-100 relative overflow-hidden">
            {/* Corner paw decoration */}
            <div className="absolute top-3 right-3 w-10 h-10 text-orange-100 pointer-events-none rotate-12"><PawBg /></div>
            <div className="absolute bottom-3 left-3 w-8 h-8 text-emerald-100 pointer-events-none -rotate-12"><PawBg /></div>

            {/* Tab switcher */}
            {mode !== 'forgot' && (
              <div className="flex rounded-2xl p-1 mb-6 border border-orange-100"
                style={{ background: 'linear-gradient(135deg, #fff7ed, #f0fdf4)' }}>
                <button onClick={() => switchMode('login')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${mode === 'login' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-gray-500 hover:text-gray-700'}`}>
                  Entrar
                </button>
                <button onClick={() => switchMode('register')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${mode === 'register' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'text-gray-500 hover:text-gray-700'}`}>
                  Criar conta
                </button>
              </div>
            )}

            {mode === 'forgot' && (
              <button onClick={() => switchMode('login')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer mb-6">
                <i className="ri-arrow-left-line text-xs"></i> Voltar ao login
              </button>
            )}

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {headings[mode].emoji} {headings[mode].title}
              </h2>
              <p className="text-gray-500 text-sm mt-1">{headings[mode].sub}</p>
            </div>

            {/* Google Login */}
            {mode !== 'forgot' && (
              <>
                <button onClick={handleGoogleLogin} disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-sm font-semibold text-gray-700 cursor-pointer disabled:opacity-60 mb-4 shadow-sm">
                  {googleLoading ? (
                    <i className="ri-loader-4-line animate-spin text-gray-400"></i>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
                      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
                      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                      <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                    </svg>
                  )}
                  {googleLoading ? 'Entrando...' : 'Continuar com Google'}
                </button>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-400 font-medium">ou</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
                <i className="ri-error-warning-line text-red-500 text-sm mt-0.5 flex-shrink-0"></i>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-4 mb-5">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📧</span>
                </div>
                <div>
                  <p className="text-emerald-800 text-sm font-semibold mb-0.5">E-mail enviado!</p>
                  <p className="text-emerald-700 text-sm leading-relaxed">{success}</p>
                </div>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Seu nome</label>
                    <div className="relative">
                      <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Como você se chama?" required
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                  <div className="relative">
                    <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com" required
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
                  </div>
                </div>
                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-gray-700">Senha</label>
                      {mode === 'login' && (
                        <button type="button" onClick={() => switchMode('forgot')}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer">
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                      <input type={showPassword ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required
                        className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                        <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-sm`}></i>
                      </button>
                    </div>
                  </div>
                )}
                {mode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar senha</label>
                    <div className="relative">
                      <i className="ri-lock-2-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                      <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" required
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
                    </div>
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3 font-semibold rounded-xl transition-all text-sm cursor-pointer mt-2 text-white shadow-sm hover:shadow-md"
                  style={{ background: mode === 'register' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="ri-loader-4-line animate-spin"></i>
                      {mode === 'login' ? 'Entrando...' : mode === 'register' ? 'Criando conta...' : 'Enviando...'}
                    </span>
                  ) : (
                    mode === 'login' ? '🐾 Entrar' : mode === 'register' ? '🐶 Criar conta gratuitamente' : '🔑 Enviar link de recuperação'
                  )}
                </button>
              </form>
            )}

            {success && mode === 'forgot' && (
              <button onClick={() => switchMode('login')}
                className="w-full py-3 text-white font-semibold rounded-xl text-sm cursor-pointer shadow-sm"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                🐾 Voltar ao login
              </button>
            )}
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            Ao continuar, você concorda com nossos{' '}
            <a href="#" className="text-orange-500 hover:underline">Termos de Uso</a>
            {' '}e{' '}
            <a href="#" className="text-orange-500 hover:underline">Política de Privacidade</a>
          </p>
          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <i className="ri-arrow-left-line mr-1 text-xs"></i> Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
