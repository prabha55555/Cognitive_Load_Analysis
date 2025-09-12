import { Activity, AlertTriangle, ArrowRight, BarChart3, Brain, CheckCircle, Clock, Download, Eye, PieChart, Target, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { mockParticipants } from '../data/mockData';
import { useEEGStream } from '../hooks/useEEGStream';
import { Participant } from '../types';

export const AdminDashboard = () => {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);

  // Animate pulse effect periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Get EEG data for all active participants
  const participantData = mockParticipants.map(participant => {
    const { currentReading } = useEEGStream(participant.id, participant.isActive);
    return { ...participant, currentReading };
  });

  // Analysis data for visualization
  const platformComparison = [
    {
      platform: 'ChatGPT',
      participants: participantData.filter(p => p.assignedPlatform === 'chatgpt').length,
      avgCognitiveLoad: participantData
        .filter(p => p.assignedPlatform === 'chatgpt')
        .reduce((sum, p) => sum + p.cognitiveLoadScore, 0) / 
        Math.max(participantData.filter(p => p.assignedPlatform === 'chatgpt').length, 1),
      avgCreativity: participantData
        .filter(p => p.assignedPlatform === 'chatgpt')
        .reduce((sum, p) => sum + p.creativityScore, 0) / 
        Math.max(participantData.filter(p => p.assignedPlatform === 'chatgpt').length, 1),
    },
    {
      platform: 'Google',
      participants: participantData.filter(p => p.assignedPlatform === 'google').length,
      avgCognitiveLoad: participantData
        .filter(p => p.assignedPlatform === 'google')
        .reduce((sum, p) => sum + p.cognitiveLoadScore, 0) / 
        Math.max(participantData.filter(p => p.assignedPlatform === 'google').length, 1),
      avgCreativity: participantData
        .filter(p => p.assignedPlatform === 'google')
        .reduce((sum, p) => sum + p.creativityScore, 0) / 
        Math.max(participantData.filter(p => p.assignedPlatform === 'google').length, 1),
    }
  ];

  const scatterData = participantData.map(p => ({
    x: p.cognitiveLoadScore,
    y: p.creativityScore,
    name: p.name,
    platform: p.assignedPlatform
  }));

  const getStatusColor = (participant: Participant) => {
    if (!participant.isActive) return 'text-slate-500 bg-slate-100 border-slate-200';
    switch (participant.currentPhase) {
      case 'research': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'creativity_test': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'completed': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getCognitiveLoadStatus = (score: number) => {
    if (score > 80) return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' };
    if (score > 60) return { icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' };
    return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' };
  };

  const exportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      participants: participantData.map(p => ({
        id: p.id,
        platform: p.assignedPlatform,
        phase: p.currentPhase,
        cognitiveLoadScore: p.cognitiveLoadScore,
        creativityScore: p.creativityScore,
        sessionDuration: Math.floor((Date.now() - p.sessionStart.getTime()) / 60000),
        isActive: p.isActive
      })),
      summary: platformComparison
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const activeParticipants = participantData.filter(p => p.isActive).length;
  const completedSessions = participantData.filter(p => p.currentPhase === 'completed').length;
  const avgCognitiveLoad = participantData.reduce((sum, p) => sum + p.cognitiveLoadScore, 0) / participantData.length;
  const avgCreativity = participantData.reduce((sum, p) => sum + p.creativityScore, 0) / participantData.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Enhanced Header */}
      <div className="relative z-10 bg-white/90 backdrop-blur-sm shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-40 ${pulseEffect ? 'animate-ping' : 'animate-pulse'}`}></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-800 via-blue-800 to-purple-800 bg-clip-text text-transparent tracking-tight">
                    Research Dashboard
                  </h1>
                  <p className="text-sm font-medium text-slate-600">Real-time EEG Study Monitoring</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-emerald-50/80 backdrop-blur-sm px-4 py-2 rounded-full border border-emerald-200/60">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">{activeParticipants} Active</span>
              </div>
              
              <button
                onClick={exportData}
                className="group relative flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-3">
                  <Download className="h-5 w-5" />
                  <span>Export Data</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-200/60 hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">Total Participants</p>
                <p className="text-4xl font-black text-slate-800">{participantData.length}</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                <div className="relative bg-blue-100 p-4 rounded-2xl shadow-lg">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-200/60 hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">Active Sessions</p>
                <p className="text-4xl font-black text-emerald-600">{activeParticipants}</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                <div className="relative bg-emerald-100 p-4 rounded-2xl shadow-lg">
                  <Activity className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-200/60 hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">Avg Cognitive Load</p>
                <p className="text-4xl font-black text-blue-600">{Math.round(avgCognitiveLoad)}%</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                <div className="relative bg-purple-100 p-4 rounded-2xl shadow-lg">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-200/60 hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">Avg Creativity</p>
                <p className="text-4xl font-black text-purple-600">{Math.round(avgCreativity)}</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                <div className="relative bg-orange-100 p-4 rounded-2xl shadow-lg">
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Enhanced Platform Comparison Chart */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-6">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h3 className="text-2xl font-black text-slate-800">Platform Comparison</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip 
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
                  <Bar dataKey="avgCognitiveLoad" fill="url(#cognitiveLoadGradient)" name="Cognitive Load" />
                  <Bar dataKey="avgCreativity" fill="url(#creativityGradient)" name="Creativity" />
                  <defs>
                    <linearGradient id="cognitiveLoadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="creativityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enhanced Cognitive Load vs Creativity Scatter */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-200/60">
            <div className="flex items-center space-x-3 mb-6">
              <PieChart className="h-6 w-6 text-purple-600" />
              <h3 className="text-2xl font-black text-slate-800">Cognitive Load vs Creativity</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="x" name="Cognitive Load" domain={[0, 100]} />
                  <YAxis type="number" dataKey="y" name="Creativity" domain={[0, 100]} />
                  <Tooltip 
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
                  <Scatter dataKey="y" fill="url(#scatterGradient)" />
                  <defs>
                    <linearGradient id="scatterGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Enhanced Participants Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white/80">
            <div className="flex items-center space-x-3">
              <Eye className="h-6 w-6 text-slate-600" />
              <h3 className="text-2xl font-black text-slate-800">Active Participants</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/60">
              <thead className="bg-slate-50/80 backdrop-blur-sm">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Phase
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Cognitive Load
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Creativity
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-slate-200/60">
                {participantData.map((participant) => {
                  const sessionDuration = Math.floor((Date.now() - participant.sessionStart.getTime()) / 60000);
                  const cognitiveLoadStatus = getCognitiveLoadStatus(participant.cognitiveLoadScore);
                  const StatusIcon = cognitiveLoadStatus.icon;
                  
                  return (
                    <tr key={participant.id} className="hover:bg-slate-50/80 transition-colors duration-200">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-lg">
                                {participant.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-lg font-bold text-slate-900">{participant.name}</div>
                            <div className="text-sm text-slate-500">{participant.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold border-2 ${
                          participant.assignedPlatform === 'chatgpt' 
                            ? 'text-emerald-600 bg-emerald-50/80 border-emerald-200/60' 
                            : 'text-blue-600 bg-blue-50/80 border-blue-200/60'
                        } backdrop-blur-sm`}>
                          {participant.assignedPlatform === 'chatgpt' ? 'ChatGPT' : 'Google'}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold border-2 backdrop-blur-sm ${getStatusColor(participant)}`}>
                          {participant.currentPhase.replace('_', ' ').toUpperCase()}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-xl ${cognitiveLoadStatus.bg} backdrop-blur-sm`}>
                            <StatusIcon className={`h-5 w-5 ${cognitiveLoadStatus.color}`} />
                          </div>
                          <span className={`text-lg font-bold ${cognitiveLoadStatus.color}`}>
                            {participant.cognitiveLoadScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-lg font-bold text-slate-900">
                        {participant.creativityScore}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-slate-400" />
                          <span className="text-lg font-bold text-slate-700">{sessionDuration}m</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};