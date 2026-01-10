import { ArrowRight, Brain, Eye, EyeOff, FlaskConical, Lock, Sparkles, Target, Users, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
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
  const [pulseEffect, setPulseEffect] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Animate pulse effect periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (userType === 'admin') {
        // Admin login - authenticate with backend
        const response = await authService.signin(email, password);
        
        // Verify admin role
        if (response.user.role !== 'admin') {
          setError('Access denied. Admin role required.');
          setIsLoading(false);
          return;
        }

        // Call onLogin with admin credentials
        onLogin(email, response.user.name, 'admin');
      } else {
        // Participant signup/signin
        try {
          // Try signup first
          const response = await authService.signup(email, password, name);
          onLogin(email, response.user.name, 'participant');
        } catch (signupError: any) {
          if (signupError.message?.includes('already registered')) {
            // User exists, try signin
            const response = await authService.signin(email, password);
            onLogin(email, response.user.name, 'participant');
          } else {
            throw signupError;
          }
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Enhanced Header */}
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-40 ${pulseEffect ? 'animate-ping' : 'animate-pulse'}`}></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                  <div className="flex items-center space-x-3">
                    <Brain className="h-10 w-10 text-white" />
                    <FlaskConical className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-slate-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Cognitive Load Research
            </h2>
            <p className="mt-3 text-lg font-semibold text-slate-600">
              Cognitive Load vs Creativity Study
            </p>
            <p className="text-sm text-slate-500 mt-2">
              ChatGPT vs Google Search Comparison
            </p>
          </div>

          {/* Enhanced Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-slate-200/60">
              <div className="space-y-6">
                {/* Enhanced User Type Selection */}
                <div>
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 block">Login As</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`relative cursor-pointer transition-all duration-300 ${userType === 'participant' ? 'scale-105' : 'hover:scale-102'}`}>
                      <input
                        type="radio"
                        value="participant"
                        checked={userType === 'participant'}
                        onChange={(e) => setUserType(e.target.value as 'participant' | 'admin')}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                        userType === 'participant' 
                          ? 'bg-gradient-to-br from-blue-50/80 to-blue-100/80 border-blue-300 shadow-lg' 
                          : 'bg-white/50 border-slate-200 hover:border-blue-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-xl ${userType === 'participant' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                            <Users className={`h-5 w-5 ${userType === 'participant' ? 'text-blue-600' : 'text-slate-500'}`} />
                          </div>
                          <div>
                            <div className={`font-bold ${userType === 'participant' ? 'text-blue-700' : 'text-slate-600'}`}>
                              Participant
                            </div>
                            <div className="text-xs text-slate-500">Join the study</div>
                          </div>
                        </div>
                      </div>
                    </label>
                    
                    <label className={`relative cursor-pointer transition-all duration-300 ${userType === 'admin' ? 'scale-105' : 'hover:scale-102'}`}>
                      <input
                        type="radio"
                        value="admin"
                        checked={userType === 'admin'}
                        onChange={(e) => setUserType(e.target.value as 'participant' | 'admin')}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                        userType === 'admin' 
                          ? 'bg-gradient-to-br from-purple-50/80 to-purple-100/80 border-purple-300 shadow-lg' 
                          : 'bg-white/50 border-slate-200 hover:border-purple-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-xl ${userType === 'admin' ? 'bg-purple-100' : 'bg-slate-100'}`}>
                            <FlaskConical className={`h-5 w-5 ${userType === 'admin' ? 'text-purple-600' : 'text-slate-500'}`} />
                          </div>
                          <div>
                            <div className={`font-bold ${userType === 'admin' ? 'text-purple-700' : 'text-slate-600'}`}>
                              Researcher
                            </div>
                            <div className="text-xs text-slate-500">Access dashboard</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Enhanced Name Field - Only for Participants */}
                {userType === 'participant' && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        placeholder="Enter your full name"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Eye className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder="your.email@university.edu"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Zap className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder={userType === 'admin' ? 'Enter admin password' : 'Create a password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                      )}
                    </button>
                  </div>
                  {userType === 'admin' && (
                    <p className="mt-2 text-xs text-slate-500">
                      Use your admin credentials to access the researcher dashboard
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                  </div>
                )}
              </div>

              {/* Enhanced Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={!email || !password || (userType === 'participant' && !name) || isLoading}
                  className="group relative w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-2xl text-lg font-bold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 overflow-hidden disabled:transform-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-3">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Authenticating...</span>
                      </>
                    ) : userType === 'participant' ? (
                      <>
                        <Target className="h-5 w-5" />
                        <span>Join Study</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span>Access Dashboard</span>
                      </>
                    )}
                    {!isLoading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />}
                  </div>
                </button>
              </div>
            </div>
          </form>

          {/* Enhanced Study Information */}
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-slate-200/60">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center">
              <Target className="h-6 w-6 mr-3 text-blue-600" />
              Study Information
            </h3>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Duration: Approximately 30-45 minutes</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="font-medium">Tasks: Research topic, complete creativity assessments</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="font-medium">Behavioral tracking: Real-time cognitive load measurement</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="font-medium">Platforms: Random assignment to ChatGPT or Google Search</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60">
              <p className="text-xs text-slate-500 leading-relaxed">
                This study has been approved by the Institutional Review Board.
                Your participation is voluntary and data will be anonymized for research purposes.
              </p>
            </div>

            {/* Dev Mode Credentials Hint */}
            {import.meta.env.DEV && (
              <div className="mt-6 p-4 bg-blue-50/80 rounded-2xl border border-blue-200/60">
                <p className="text-xs font-bold text-blue-700 mb-2">🔧 Development Mode</p>
                <p className="text-xs text-blue-600">
                  Admin: test@example.com / password123
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};