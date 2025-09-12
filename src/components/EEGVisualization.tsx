import { Activity, Brain, Eye, Heart, Sparkles, TrendingUp, Waves, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EEGData } from '../types';

interface EEGVisualizationProps {
  eegData: EEGData[];
  currentReading: EEGData | null;
  participantName: string;
}

export const EEGVisualization = ({
  eegData,
  currentReading,
  participantName
}: EEGVisualizationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);

  // Animate pulse effect periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Process data for visualization
  const chartData = useMemo(() => {
    return eegData.slice(-50).map((reading: EEGData, index: number) => ({
      time: index,
      cognitiveLoad: reading.cognitiveLoad,
      theta: reading.thetaPower,
      alpha: reading.alphaPower,
      beta: reading.betaPower,
      engagement: reading.engagement
    }));
  }, [eegData]);

  const getCognitiveLoadColor = (load: number) => {
    if (load < 30) return 'text-emerald-600';
    if (load < 70) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getCognitiveLoadBg = (load: number) => {
    if (load < 30) return 'bg-emerald-50/80';
    if (load < 70) return 'bg-amber-50/80';
    return 'bg-rose-50/80';
  };

  const getCognitiveLoadGradient = (load: number) => {
    if (load < 30) return 'from-emerald-400 via-emerald-500 to-emerald-600';
    if (load < 70) return 'from-amber-400 via-amber-500 to-amber-600';
    return 'from-rose-400 via-rose-500 to-rose-600';
  };

  const getCognitiveLoadBorder = (load: number) => {
    if (load < 30) return 'border-emerald-200';
    if (load < 70) return 'border-amber-200';
    return 'border-rose-200';
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 rounded-3xl shadow-2xl p-8 border border-slate-200/60 backdrop-blur-sm overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header with Enhanced Typography */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-40 ${pulseEffect ? 'animate-ping' : 'animate-pulse'}`}></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold bg-gradient-to-r from-slate-800 via-blue-800 to-purple-800 bg-clip-text text-transparent tracking-tight">
              Live EEG Monitor
            </h3>
            <p className="text-sm font-medium text-slate-600 mt-1 flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {participantName}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full ${pulseEffect ? 'animate-ping' : 'animate-pulse'} shadow-lg`}></div>
          <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Live Streaming
          </span>
        </div>
      </div>

      {/* Current Readings with Glassmorphism Design */}
      {currentReading && (
        <div className="relative z-10 grid grid-cols-2 gap-6 mb-8">
          <div className={`p-6 rounded-2xl ${getCognitiveLoadBg(currentReading.cognitiveLoad)} ${getCognitiveLoadBorder(currentReading.cognitiveLoad)} border-2 backdrop-blur-sm shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Cognitive Load</span>
              <div className="p-2 bg-white/50 rounded-xl">
                <TrendingUp className={`h-5 w-5 ${getCognitiveLoadColor(currentReading.cognitiveLoad)}`} />
              </div>
            </div>
            <div className="flex items-end space-x-3">
              <p className={`text-4xl font-black ${getCognitiveLoadColor(currentReading.cognitiveLoad)} tracking-tight`}>
                {Math.round(currentReading.cognitiveLoad)}%
              </p>
              <div className="flex-1 h-3 bg-slate-200/60 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className={`h-full bg-gradient-to-r ${getCognitiveLoadGradient(currentReading.cognitiveLoad)} rounded-full transition-all duration-700 ease-out shadow-lg`}
                  style={{ width: `${currentReading.cognitiveLoad}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50/80 to-pink-50/80 border-2 border-purple-200/60 backdrop-blur-sm shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Engagement</span>
              <div className="p-2 bg-white/50 rounded-xl">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-end space-x-3">
              <p className="text-4xl font-black text-purple-600 tracking-tight">
                {Math.round(currentReading.engagement)}%
              </p>
              <div className="flex-1 h-3 bg-slate-200/60 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out shadow-lg"
                  style={{ width: `${currentReading.engagement}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brain Wave Patterns with Enhanced Visualization */}
      <div className="relative z-10 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-slate-800 tracking-tight">Cognitive Load Timeline</h4>
            <div className="flex items-center space-x-2">
              <Waves className="h-6 w-6 text-blue-500" />
              <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
            </div>
          </div>
          <div className="h-56 bg-gradient-to-br from-blue-50/80 via-white to-purple-50/80 rounded-2xl p-6 border border-slate-200/60 backdrop-blur-sm shadow-xl">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cognitiveLoadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${value}`}
                  formatter={(value: number, name: string) => [
                    `${Math.round(value)}%`, 
                    'Cognitive Load'
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    backdropFilter: 'blur(10px)',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cognitiveLoad" 
                  stroke="url(#cognitiveLoadGradient)" 
                  strokeWidth={4}
                  fill="url(#cognitiveLoadGradient)"
                  dot={false}
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-slate-800 tracking-tight">Brain Wave Patterns</h4>
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-purple-500" />
              <Heart className="h-4 w-4 text-pink-400 animate-pulse" />
            </div>
          </div>
          <div className="h-48 bg-gradient-to-br from-purple-50/80 via-white to-pink-50/80 rounded-2xl p-6 border border-slate-200/60 backdrop-blur-sm shadow-xl">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 80]} hide />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${value}`}
                  formatter={(value: number, name: string) => [
                    Math.round(value), 
                    name.charAt(0).toUpperCase() + name.slice(1) + ' Power'
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    backdropFilter: 'blur(10px)',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="theta" 
                  stroke="url(#thetaGradient)" 
                  strokeWidth={3} 
                  dot={false}
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
                <Line 
                  type="monotone" 
                  dataKey="alpha" 
                  stroke="url(#alphaGradient)" 
                  strokeWidth={3} 
                  dot={false}
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
                <Line 
                  type="monotone" 
                  dataKey="beta" 
                  stroke="url(#betaGradient)" 
                  strokeWidth={3} 
                  dot={false}
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
                <defs>
                  <linearGradient id="thetaGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <linearGradient id="alphaGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                  <linearGradient id="betaGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Enhanced Legend */}
          <div className="flex justify-center space-x-8 mt-6">
            <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
              <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full shadow-md"></div>
              <span className="text-sm font-semibold text-slate-700">Theta</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-md"></div>
              <span className="text-sm font-semibold text-slate-700">Alpha</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
              <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full shadow-md"></div>
              <span className="text-sm font-semibold text-slate-700">Beta</span>
            </div>
          </div>
        </div>

        {/* Real-time Metrics with Glassmorphism */}
        {currentReading && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-purple-50/80 to-purple-100/80 rounded-2xl border border-purple-200/60 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Theta Power</p>
              <p className="text-2xl font-black text-purple-600 tracking-tight">{Math.round(currentReading.thetaPower)}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50/80 to-blue-100/80 rounded-2xl border border-blue-200/60 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Alpha Power</p>
              <p className="text-2xl font-black text-blue-600 tracking-tight">{Math.round(currentReading.alphaPower)}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 rounded-2xl border border-emerald-200/60 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Beta Power</p>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">{Math.round(currentReading.betaPower)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};