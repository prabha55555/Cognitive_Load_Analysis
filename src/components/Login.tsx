import React, { useState } from 'react';
import { authService } from '../services/authService';

interface LoginProps {
  onLogin: (email: string, name: string, userType: 'participant' | 'admin') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'participant' | 'admin'>('participant');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (userType === 'admin') {
        const response = await authService.signin(email, password);
        if (response.user.role !== 'admin') {
          setError('Access denied. Admin role required.');
          setIsLoading(false);
          return;
        }
        onLogin(email, response.user.name, 'admin');
      } else {
        try {
          const response = await authService.signup(email, password, name);
          onLogin(email, response.user.name, 'participant');
        } catch (signupError: any) {
          if (signupError.code === 'email_exists' || signupError.message?.includes('already exists')) {
            try {
              const response = await authService.signin(email, password);
              onLogin(email, response.user.name, 'participant');
            } catch (signinError: any) {
              setError('Account exists but password is incorrect. Please check your password.');
              setIsLoading(false);
              return;
            }
          } else {
            throw signupError;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await authService.signInWithGoogle(`${window.location.origin}/`);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:grid md:grid-cols-2 bg-[#090a0c] text-white selection:bg-[#00bfdb] selection:text-[#090a0c]">
      <style>{`
        .font-display { font-family: 'Cabinet Grotesk', system-ui, -apple-system, sans-serif; }
        .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace; }
        .input-base {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 7px;
          padding: 0.65rem 0.9rem;
          color: white;
          width: 100%;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .input-base:focus {
          border-color: #00bfdb;
        }
        .input-label {
          display: block;
          font-family: 'Geist Mono', ui-monospace, monospace;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.4rem;
        }
        .btn-cyan {
          background-color: #00bfdb;
          color: #090a0c;
          width: 100%;
          padding: 0.8rem;
          border-radius: 7px;
          font-weight: 700;
          transition: opacity 0.2s, transform 0.2s;
        }
        .btn-cyan:hover:not(:disabled) {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .btn-cyan:active:not(:disabled) {
          transform: scale(0.98);
        }
      `}</style>

      {/* Left Panel Context */}
      <div className="relative flex flex-col justify-between p-[1.2rem] md:p-12 lg:p-14 border-b md:border-b-0 md:border-r border-white/[0.07] overflow-hidden">
        {/* Subtle grid bg */}
        <div className="absolute inset-0 z-0 opacity-40 hidden md:block" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="relative flex h-2 w-2 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00bfdb] opacity-60"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00bfdb]"></span>
          </div>
          <span className="font-mono text-[0.8rem] uppercase tracking-widest text-white/90">Cognitive Load Lab</span>
        </div>

        <div className="relative z-10 mt-8 mb-4 md:my-auto">
          <h1 className="font-display font-[900] text-[clamp(2.5rem,4vw,4rem)] leading-[1.05] tracking-tight text-white m-0">
            Observe cognition<br />
            while people<br />
            <span className="text-[#00bfdb]">search.</span>
          </h1>
          <p className="mt-6 max-w-sm text-[1rem] text-white/50 leading-relaxed">
            Comparing Google Search and conversational AI under measurable cognitive load.
          </p>
        </div>

        <div className="relative z-10 hidden md:flex gap-3">
          <div className="font-mono text-[0.65rem] uppercase tracking-wider px-3 py-1.5 border border-[#00bfdb] text-[#00bfdb] rounded-full">Secure Session</div>
          <div className="font-mono text-[0.65rem] uppercase tracking-wider px-3 py-1.5 border border-[#00bfdb] text-[#00bfdb] rounded-full">Behavioral Telemetry</div>
        </div>
      </div>

      {/* Right Panel Form */}
      <div className="relative flex flex-col justify-center p-8 md:p-12 lg:p-14 bg-[#090a0c]">
        {/* IRB Badge */}
        <div className="absolute top-6 right-6 hidden md:block border border-white/20 rounded-full px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-white/40">
          IRB Approved
        </div>

        <div className="w-full max-w-[380px] mx-auto relative z-10">
          
          <div className="mb-8">
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setUserType('participant')}
                className={`flex-1 py-2 rounded font-display font-[700] text-sm transition-all duration-200 ${userType === 'participant' ? 'bg-[#00bfdb]/[0.08] text-[#00bfdb] border border-[#00bfdb]' : 'bg-white/[0.04] text-white/40 border border-transparent hover:bg-white/[0.08]'}`}
              >
                Participant
              </button>
              <button
                type="button"
                onClick={() => setUserType('admin')}
                className={`flex-1 py-2 rounded font-display font-[700] text-sm transition-all duration-200 ${userType === 'admin' ? 'bg-[#00bfdb]/[0.08] text-[#00bfdb] border border-[#00bfdb]' : 'bg-white/[0.04] text-white/40 border border-transparent hover:bg-white/[0.08]'}`}
              >
                Researcher
              </button>
            </div>
            <div className="h-4 relative overflow-hidden">
              <p className={`font-mono text-[0.72rem] text-white/50 absolute w-full transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${userType === 'participant' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                Join the study — 30–45 min session
              </p>
              <p className={`font-mono text-[0.72rem] text-white/50 absolute w-full transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${userType === 'admin' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                Access dashboard — IRB-gated
              </p>
            </div>
          </div>

          {userType === 'participant' && (
            <div className="mb-6 space-y-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                className="w-full flex items-center justify-center gap-3 bg-transparent border border-white/20 rounded-[7px] py-[0.65rem] font-display font-[700] text-sm text-white/90 hover:border-white/40 transition-colors disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#EA4335" d="M9 7.364v3.523h4.918c-.216 1.136-.864 2.099-1.836 2.745l2.97 2.304c1.73-1.593 2.73-3.936 2.73-6.718 0-.637-.057-1.25-.164-1.841H9z"/>
                  <path fill="#34A853" d="M3.655 10.713l-.67.512-2.373 1.848A8.993 8.993 0 0 0 9 18c2.43 0 4.468-.804 5.957-2.064l-2.97-2.304c-.821.551-1.87.876-2.987.876-2.297 0-4.24-1.55-4.936-3.636-.177-.529-.277-1.092-.277-1.672 0-.58.1-1.143.277-1.672V4.892H1.255A8.994 8.994 0 0 0 0 9c0 1.451.347 2.823.962 4.073l2.693-2.36z"/>
                  <path fill="#4A90E2" d="M9 3.58c1.321 0 2.507.454 3.44 1.345l2.58-2.58C13.464.891 11.426 0 9 0 5.471 0 2.415 2.018.962 4.927l3.102 2.4C4.76 5.131 6.703 3.58 9 3.58z"/>
                  <path fill="#FBBC05" d="M.962 4.927A8.994 8.994 0 0 0 0 9c0 1.451.347 2.823.962 4.073l3.102-2.4A5.38 5.38 0 0 1 3.787 9c0-.58.1-1.143.277-1.673l-3.102-2.4z"/>
                </svg>
                {isGoogleLoading ? 'Redirecting...' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-white/[0.08] flex-1"></div>
                <span className="font-mono text-[0.65rem] uppercase text-white/40 tracking-wider">or use email</span>
                <div className="h-px bg-white/[0.08] flex-1"></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`overflow-hidden transition-all duration-300 ease-out ${userType === 'participant' ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0 m-0 p-0'}`}>
              <label htmlFor="name" className="input-label">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base"
                required={userType === 'participant'}
                tabIndex={userType === 'participant' ? 0 : -1}
              />
            </div>

            <div>
              <label htmlFor="email" className="input-label">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="input-label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3 flex items-center text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="pt-2">
                <p className="font-mono text-[0.7rem] text-red-400">{error}</p>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-cyan font-display"
              >
                {isLoading ? 'Authenticating...' : userType === 'participant' ? 'Join Cohort' : 'Sign In'}
              </button>
            </div>
            
            {userType === 'participant' && (
              <div className="text-center pt-2">
                <a href="#" className="font-mono text-[0.7rem] text-[#00bfdb] hover:underline">Already have an account? Sign in</a>
              </div>
            )}
          </form>

          {userType === 'participant' && (
            <div className="mt-12 pt-6 border-t border-white/[0.06] text-center md:text-left flex flex-wrap justify-center md:justify-start gap-x-2 gap-y-1 font-mono text-[0.7rem] text-white/40">
              <span>30–45 min</span>
              <span>·</span>
              <span>2 platforms</span>
              <span>·</span>
              <span>n=284 enrolled</span>
              <span>·</span>
              <span>Anonymized data</span>
            </div>
          )}
          
          <div className="mt-8 md:mt-24 pb-4">
            <p className="font-mono text-[0.65rem] text-white/[0.18]">
              This study is monitored under IRB approved protocol. No unauthorized access permitted.
            </p>
          </div>

          {import.meta.env.DEV && (
            <div className="mt-2 pt-2">
              <p className="font-mono text-[0.65rem] text-white/[0.18]">
                DEV · admin@example.com / password123
              </p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};