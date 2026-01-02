import { ArrowRight, BarChart3, Brain, Clock, MessageSquare, Search, Target, TestTube, Users, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onJoinStudy: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onJoinStudy }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);

  // Animate pulse effect periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1000);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Join Study',
      description: 'Sign up and get assigned to ChatGPT or Google Search',
      color: 'text-blue-600 bg-blue-100 border-blue-200',
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: 'Behavioral Setup',
      description: 'Initialize interaction tracking for cognitive load monitoring',
      color: 'text-purple-600 bg-purple-100 border-purple-200',
      gradient: 'from-purple-400 to-purple-600'
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: 'Research Task',
      description: 'Complete information retrieval using your assigned platform',
      color: 'text-emerald-600 bg-emerald-100 border-emerald-200',
      gradient: 'from-emerald-400 to-emerald-600'
    },
    {
      icon: <TestTube className="h-8 w-8" />,
      title: 'Creativity Test',
      description: 'Take creative thinking assessments',
      color: 'text-orange-600 bg-orange-100 border-orange-200',
      gradient: 'from-orange-400 to-orange-600'
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Results',
      description: 'View your cognitive load and creativity scores',
      color: 'text-indigo-600 bg-indigo-100 border-indigo-200',
      gradient: 'from-indigo-400 to-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-2/3 right-1/3 w-72 h-72 bg-gradient-to-br from-indigo-400/8 to-blue-400/8 rounded-full blur-3xl animate-pulse delay-1500"></div>
      </div>

      {/* Enhanced Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-40 ${pulseEffect ? 'animate-ping' : 'animate-pulse'}`}></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 tracking-wide">
                    Cognitive Load Research
                  </h1>
                  <p className="text-sm font-medium text-slate-600">Cognitive Load vs Creativity Study</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-emerald-50/80 backdrop-blur-sm px-4 py-2 rounded-full border border-emerald-200/60">
                <div className={`w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full ${pulseEffect ? 'animate-ping' : 'animate-pulse'} shadow-lg`}></div>
                <span className="text-sm font-semibold text-emerald-700">Live Study</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-white to-slate-50/80 p-12 rounded-full shadow-2xl border border-slate-200/60 backdrop-blur-sm">
                  <div className="relative">
                    <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-30 ${pulseEffect ? 'animate-ping' : 'animate-pulse'}`}></div>
                    <Brain className="h-20 w-20 text-blue-600 relative z-10" />
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-8 leading-tight">
              Understanding
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-extrabold">
                {' '}Cognitive Load
              </span>
              <br />
              <span className="text-4xl md:text-5xl font-semibold">in the AI Era</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed font-normal">
              Join our groundbreaking research study comparing how <span className="font-semibold text-slate-800">ChatGPT</span> and <span className="font-semibold text-slate-800">Google Search</span> 
              affect cognitive load and creativity during information retrieval tasks.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <button
                onClick={onJoinStudy}
                className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-3">
                  <Zap className="h-6 w-6" />
                  <span className="text-lg">Join the Study</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>
              <button className="px-10 py-5 border-2 border-slate-300 text-slate-700 font-semibold rounded-2xl hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 backdrop-blur-sm">
                Learn More
              </button>
            </div>

            {/* Enhanced Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-xl">
                <div className="flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">30-45 Min</h3>
                <p className="text-slate-600 font-medium">Complete in one session</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-xl">
                <div className="flex items-center justify-center mb-4">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Behavioral Analysis</h3>
                <p className="text-slate-600 font-medium">Live cognitive load monitoring</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-xl">
                <div className="flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Creativity Tests</h3>
                <p className="text-slate-600 font-medium">Assess creative thinking</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Study Overview */}
      <section className="relative z-10 py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-wide">Study Overview</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
              We're investigating how different information retrieval platforms affect your brain activity 
              and creative thinking processes in real-time.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50/80 to-blue-100/80 border border-blue-200/60 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <Clock className="h-12 w-12 text-blue-600 relative z-10 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">30-45 Minutes</h3>
              <p className="text-slate-600 font-medium">Complete the study in one focused session</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50/80 to-purple-100/80 border border-purple-200/60 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <Brain className="h-12 w-12 text-purple-600 relative z-10 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Behavioral Analysis</h3>
              <p className="text-slate-600 font-medium">Live cognitive load monitoring</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 border border-emerald-200/60 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <TestTube className="h-12 w-12 text-emerald-600 relative z-10 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Creativity Tests</h3>
              <p className="text-slate-600 font-medium">Assess your creative thinking</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Progress Timeline */}
      <section className="relative z-10 py-20 bg-gradient-to-br from-slate-50/80 to-blue-50/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-wide">Study Process</h2>
            <p className="text-xl text-slate-600 font-normal">Follow these simple steps to complete the study</p>
          </div>
          
          <div className="relative">
            {/* Enhanced Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-px h-full w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 rounded-full"></div>
            
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Enhanced Step Circle */}
                  <div className={`absolute left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-r ${step.gradient} flex items-center justify-center shadow-2xl border-4 border-white`}>
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r ${step.gradient} rounded-full blur-lg opacity-50 animate-pulse`}></div>
                      <div className="relative z-10 text-white">
                        {step.icon}
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Content */}
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12 text-left'}`}>
                    <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-slate-200/60 hover:shadow-3xl transition-all duration-300 hover:scale-105">
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">{step.title}</h3>
                      <p className="text-slate-600 font-medium leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Platform Comparison */}
      <section className="relative z-10 py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-wide">Platforms You'll Use</h2>
            <p className="text-xl text-slate-600 font-normal">You'll be randomly assigned to one of these platforms</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 p-10 rounded-3xl border-2 border-emerald-200/60 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-6">
                <div className="relative mr-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">ChatGPT</h3>
              </div>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed font-normal">
                AI-powered conversational search with contextual responses and creative assistance.
              </p>
              <ul className="space-y-3 text-slate-600 font-medium">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Conversational interface</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Contextual responses</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Creative assistance</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 p-10 rounded-3xl border-2 border-blue-200/60 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-6">
                <div className="relative mr-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Search className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">Google Search</h3>
              </div>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed font-normal">
                Traditional keyword-based search with multiple result sources and manual filtering.
              </p>
              <ul className="space-y-3 text-slate-600 font-medium">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Keyword-based search</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Multiple sources</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Manual filtering</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="relative mr-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                <Brain className="h-10 w-10 text-blue-400 relative z-10" />
              </div>
              <span className="text-2xl font-bold">Cognitive Load Research</span>
            </div>
            <p className="text-slate-300 mb-6 text-lg max-w-2xl mx-auto leading-relaxed font-normal">
              Advancing our understanding of cognitive load and creativity in the digital age through 
              behavioral analysis technology and innovative research methodologies.
            </p>
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/60 max-w-2xl mx-auto">
              <p className="text-sm text-slate-400 leading-relaxed font-normal">
                This study has been approved by the Institutional Review Board. 
                Your participation is voluntary and data will be anonymized for research purposes.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}; 