import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type Mode = 'login' | 'register' | 'forgot';

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

      // Cria perfil no Firestore se não existir
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
      if (code === 'auth/popup-closed-by-user') {
        // usuário fechou — não mostra erro
      } else {
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
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        setLoading(false);
        return;
      }
      const { error: err } = await register(name, email, password);
      if (err) setError(err);
    } else if (mode === 'forgot') {
      const { error: err } = await resetPassword(email);
      if (err) {
        setError(err);
      } else {
        setSuccess('E-mail enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.');
      }
    }

    setLoading(false);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setSuccess('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const headings: Record<Mode, { title: string; sub: string }> = {
    login: { title: 'Bem-vindo(a) de volta!', sub: 'Entre na sua conta para continuar.' },
    register: { title: 'Crie sua conta', sub: 'Cadastre-se gratuitamente e comece agora.' },
    forgot: { title: 'Esqueci minha senha', sub: 'Digite seu e-mail e enviaremos um link para redefinir sua senha.' },
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=1000&fit=crop"
          alt="Pets felizes"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/60 via-emerald-800/40 to-emerald-900/70"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <div className="w-16 h-16 flex items-center justify-center mb-4">
            <img src="/logo.png" alt="PetVida" className="w-16 h-16 object-contain rounded-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">PetVida Care</h1>
          <p className="text-white/80 text-base leading-relaxed">
            O lugar certo para cuidar de quem você mais ama. Organize vacinas, consultas e a saúde dos seus pets com carinho.
          </p>
          <div className="flex flex-col gap-3 mt-8 w-full max-w-xs">
            {[
              { icon: 'ri-shield-check-line', text: 'Dados seguros e privados' },
              { icon: 'ri-alarm-line', text: 'Lembretes automáticos' },
              { icon: 'ri-heart-pulse-line', text: 'Histórico completo de saúde' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <i className={`${item.icon} text-emerald-300`}></i>
                <span className="text-white/90 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <img src="/logo.png" alt="PetVida" className="w-10 h-10 object-contain rounded-xl" />
            <span className="text-xl font-bold text-gray-800">PetVida</span>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">

            {/* Tab switcher */}
            {mode !== 'forgot' && (
              <div className="flex bg-gray-100 rounded-full p-1 mb-6">
                <button onClick={() => switchMode('login')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap ${mode === 'login' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  Entrar
                </button>
                <button onClick={() => switchMode('register')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap ${mode === 'register' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  Criar conta
                </button>
              </div>
            )}

            {/* Back button on forgot mode */}
            {mode === 'forgot' && (
              <button onClick={() => switchMode('login')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer mb-6">
                <i className="ri-arrow-left-line text-xs"></i> Voltar ao login
              </button>
            )}

            <h2 className="text-2xl font-bold text-gray-800 mb-1">{headings[mode].title}</h2>
            <p className="text-gray-500 text-sm mb-6">{headings[mode].sub}</p>

            {/* Google Login Button */}
            {mode !== 'forgot' && (
              <>
                <button onClick={handleGoogleLogin} disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-sm font-semibold text-gray-700 cursor-pointer disabled:opacity-60 mb-4">
                  {googleLoading ? (
                    <i className="ri-loader-4-line animate-spin text-gray-400"></i>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <i className="ri-mail-check-line text-emerald-600 text-base"></i>
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
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                  <div className="relative">
                    <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com" required
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all" />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-gray-700">Senha</label>
                      {mode === 'login' && (
                        <button type="button" onClick={() => switchMode('forgot')}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer">
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                      <input type={showPassword ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required
                        className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all" />
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
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all" />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold rounded-xl transition-all text-sm cursor-pointer mt-2">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="ri-loader-4-line animate-spin"></i>
                      {mode === 'login' ? 'Entrando...' : mode === 'register' ? 'Criando conta...' : 'Enviando...'}
                    </span>
                  ) : (
                    mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta gratuitamente' : 'Enviar link de recuperação'
                  )}
                </button>
              </form>
            )}

            {success && mode === 'forgot' && (
              <button onClick={() => switchMode('login')}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm cursor-pointer">
                Voltar ao login
              </button>
            )}
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            Ao continuar, você concorda com nossos{' '}
            <a href="#" className="text-emerald-600 hover:underline">Termos de Uso</a>
            {' '}e{' '}
            <a href="#" className="text-emerald-600 hover:underline">Política de Privacidade</a>
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
