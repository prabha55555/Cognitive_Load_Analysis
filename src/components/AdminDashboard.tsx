import { AlertTriangle, Brain, CheckCircle, Download, Settings, TrendingUp, Users } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { mockParticipants } from '../data/mockData';
import { useEEGStream } from '../hooks/useEEGStream';
import { Participant } from '../types';

interface DashboardAnalytics {
  overview: {
    totalParticipants: number;
    activeSessions: number;
    avgCognitiveLoad: number;
    avgCreativity: number;
  };
  platformComparison: Array<{
    platform: string;
    participantCount: number;
    avgCognitiveLoad: number;
    avgCreativity: number;
    avgEngagement: number;
    completionRate: number;
    avgSessionTime: number;
  }>;
  participantData: Array<{
    x: number;
    y: number;
    platform: string;
    name: string;
    engagement: number;
  }>;
  timestamp: number;
}

export const AdminDashboard: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(null);
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);
  const [topicSelectionMode, setTopicSelectionMode] = useState<'random' | 'custom'>('random');
  const [customTopic, setCustomTopic] = useState('');
  const [lastCreatedTopic, setLastCreatedTopic] = useState<string>('');
  const [creationMessage, setCreationMessage] = useState<string>('');
  const [showCreationAlert, setShowCreationAlert] = useState(false);
  
  const availableTopics = [
    'Climate Change',
    'Artificial Intelligence', 
    'Space Exploration',
    'Renewable Energy',
    'Cybersecurity',
    'Quantum Computing',
    'Biotechnology',
    'Ocean Conservation',
    'Smart Cities',
    'Digital Privacy',
    'Sustainable Transportation'
  ];

  // Get EEG data for all active participants
  const participantData = participants.map(participant => {
    const { currentReading } = useEEGStream(participant.id, participant.isActive);
    return { ...participant, currentReading };
  });

  // Fetch real-time dashboard analytics
  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/dashboard/analytics');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.warn('Using fallback dashboard data');
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const getRandomTopic = () => {
    const randomIndex = Math.floor(Math.random() * availableTopics.length);
    return availableTopics[randomIndex];
  };

  const handleCreateParticipant = (platform: 'chatgpt' | 'google') => {
    console.log('==========================================');
    console.log('🚀 CREATING PARTICIPANT');
    console.log('Mode:', topicSelectionMode);
    console.log('Custom topic input:', customTopic);
    console.log('Custom topic length:', customTopic?.length);
    console.log('Platform:', platform);
    console.log('==========================================');
    
    let selectedTopic = '';
    
    if (topicSelectionMode === 'random') {
      selectedTopic = getRandomTopic();
      console.log('🎲 Random topic selected:', selectedTopic);
    } else {
      selectedTopic = customTopic.trim();
      console.log('✏️ Custom topic used:', selectedTopic);
      console.log('✏️ Custom topic trimmed length:', selectedTopic.length);
      
      // Enhanced validation for custom topics
      if (!selectedTopic || selectedTopic.length < 3) {
        console.error('❌ Custom topic validation failed:', selectedTopic);
        setCreationMessage('❌ Custom topic must be at least 3 characters long');
        setShowCreationAlert(true);
        setTimeout(() => setShowCreationAlert(false), 3000);
        return;
      }
    }

    const newParticipant: Participant = {
      id: `P${Date.now()}`,
      name: `Participant ${participants.length + 1}`,
      email: `participant${participants.length + 1}@study.com`,
      researchTopic: selectedTopic,
      assignedPlatform: platform,
      sessionStart: new Date(),
      isActive: true,
      currentPhase: 'research',
      cognitiveLoadScore: 0,
      creativityScore: 0
    };

    console.log('==========================================');
    console.log('✅ PARTICIPANT CREATED');
    console.log('Participant ID:', newParticipant.id);
    console.log('Participant Name:', newParticipant.name);
    console.log('Research Topic:', newParticipant.researchTopic);
    console.log('Assigned Platform:', newParticipant.assignedPlatform);
    console.log('Current Phase:', newParticipant.currentPhase);
    console.log('Full Participant Object:', newParticipant);
    console.log('==========================================');

    setParticipants(prev => [...prev, newParticipant]);
    setLastCreatedTopic(selectedTopic);
    setCreationMessage(`✅ Participant created successfully with topic: "${selectedTopic}" on ${platform.toUpperCase()} platform`);
    setShowCreationAlert(true);
    
    // Reset form
    setCustomTopic('');
    
    // Hide success message after 5 seconds
    setTimeout(() => setShowCreationAlert(false), 5000);
    
    console.log('👤 New participant created:', newParticipant);
  };

  // Stable platform comparison data with consistent structure
  const platformComparison = useMemo(() => [
    {
      platform: 'ChatGPT',
      participants: dashboardData?.platformComparison?.[0]?.participantCount || 6,
      avgCognitiveLoad: Math.round((dashboardData?.platformComparison?.[0]?.avgCognitiveLoad || 65.2) * 100) / 100,
      avgCreativity: Math.round((dashboardData?.platformComparison?.[0]?.avgCreativity || 78.4) * 100) / 100,
      engagement: Math.round((dashboardData?.platformComparison?.[0]?.avgEngagement || 71.8) * 100) / 100,
      completionRate: Math.round((dashboardData?.platformComparison?.[0]?.completionRate || 83) * 100) / 100,
      activeCount: Math.floor((dashboardData?.platformComparison?.[0]?.participantCount || 6) * 0.75),
      avgSessionTime: Math.round((dashboardData?.platformComparison?.[0]?.avgSessionTime || 24) * 100) / 100
    },
    {
      platform: 'Google',
      participants: dashboardData?.platformComparison?.[1]?.participantCount || 6,
      avgCognitiveLoad: Math.round((dashboardData?.platformComparison?.[1]?.avgCognitiveLoad || 68.7) * 100) / 100,
      avgCreativity: Math.round((dashboardData?.platformComparison?.[1]?.avgCreativity || 74.1) * 100) / 100,
      engagement: Math.round((dashboardData?.platformComparison?.[1]?.avgEngagement || 66.3) * 100) / 100,
      completionRate: Math.round((dashboardData?.platformComparison?.[1]?.completionRate || 75) * 100) / 100,
      activeCount: Math.floor((dashboardData?.platformComparison?.[1]?.participantCount || 6) * 0.75),
      avgSessionTime: Math.round((dashboardData?.platformComparison?.[1]?.avgSessionTime || 28) * 100) / 100
    }
  ], [dashboardData?.platformComparison]);

  // Stable scatter plot data with consistent structure
  const scatterData = useMemo(() => {
    if (dashboardData?.participantData) {
      return dashboardData.participantData.map(p => ({
        x: p.x,
        y: p.y,
        z: p.engagement,
        name: p.name,
        platform: p.platform,
        phase: 'research',
        isActive: true,
        sessionDuration: Math.floor(Math.random() * 30) + 10,
        topic: 'Research Topic'
      }));
    }
    
    return participantData.map(p => ({
      x: p.currentReading?.cognitiveLoad || p.cognitiveLoadScore,
      y: p.creativityScore,
      z: p.currentReading?.engagement || 65,
      name: p.name,
      platform: p.assignedPlatform,
      phase: p.currentPhase,
      isActive: p.isActive,
      sessionDuration: Math.floor((Date.now() - p.sessionStart.getTime()) / 60000),
      topic: p.researchTopic
    }));
  }, [dashboardData?.participantData, participantData]);

  const getStatusColor = (participant: Participant) => {
    if (!participant.isActive) return 'text-gray-500 bg-gray-100';
    switch (participant.currentPhase) {
      case 'research': return 'text-green-600 bg-green-100';
      case 'creativity_test': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'login': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCognitiveLoadStatus = (score: number) => {
    if (score > 80) return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' };
    if (score > 60) return { icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-800">Research Admin Dashboard</h1>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">EEG Cognitive Load vs Creativity Study</p>
                  {dashboardData && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600">Live Data</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={exportData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-3xl font-bold text-blue-600">
                  {dashboardData?.overview?.totalParticipants || participantData.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-3xl font-bold text-green-600">
                  {dashboardData?.overview?.activeSessions || participantData.filter(p => p.isActive).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Cognitive Load</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {dashboardData?.overview?.avgCognitiveLoad || Math.round(participantData.reduce((sum, p) => sum + p.cognitiveLoadScore, 0) / participantData.length)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Creativity</p>
                <p className="text-3xl font-bold text-purple-600">
                  {dashboardData?.overview?.avgCreativity || Math.round(participantData.reduce((sum, p) => sum + p.creativityScore, 0) / participantData.length)}
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Topic Selection Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create New Participant</h3>
            <button
              onClick={() => {
                console.log('🧪 Testing random topic selection:');
                for (let i = 0; i < 5; i++) {
                  console.log(`Test ${i + 1}: ${getRandomTopic()}`);
                }
              }}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              🧪 Test Random
            </button>
          </div>
          
          {/* Success/Error Alert */}
          {showCreationAlert && (
            <div className={`mb-4 p-4 rounded-lg ${
              creationMessage.startsWith('✅') 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <p className="text-sm font-medium">{creationMessage}</p>
            </div>
          )}
          
          {/* Topic Selection Mode */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic Assignment Method
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setTopicSelectionMode('random');
                  console.log('🎯 Switched to random topic mode');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  topicSelectionMode === 'random'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🎲 Random Topic
              </button>
              <button
                onClick={() => {
                  setTopicSelectionMode('custom');
                  console.log('🎯 Switched to custom topic mode');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  topicSelectionMode === 'custom'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ✏️ Custom Topic
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current mode: <span className="font-semibold">{topicSelectionMode}</span>
            </p>
          </div>

          {/* Topic Input/Display */}
          {topicSelectionMode === 'random' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Topics (Random Selection)
              </label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg">
                {availableTopics.map((topic, index) => (
                  <span key={index} className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                    {topic}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                A random topic will be assigned when participant is created
              </p>
              {lastCreatedTopic && (
                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">Last assigned topic:</span> "{lastCreatedTopic}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <label htmlFor="customTopic" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Custom Research Topic
              </label>
              <input
                id="customTopic"
                type="text"
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  console.log('✏️ Custom topic input:', e.target.value);
                }}
                placeholder="e.g., Sustainable Transportation, Machine Learning in Healthcare, Blockchain Technology..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                maxLength={100}
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Enter any research topic you want the participant to explore
                </p>
                <span className="text-xs text-gray-400">
                  {customTopic.length}/100 characters
                </span>
              </div>
              {customTopic.trim() && (
                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                  <p className="text-xs text-green-700">
                    <span className="font-semibold">Topic preview:</span> "{customTopic.trim()}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Create Participant Buttons */}
          <div className="space-y-3">
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  console.log('🚀 Creating ChatGPT participant...');
                  handleCreateParticipant('chatgpt');
                }}
                disabled={topicSelectionMode === 'custom' && !customTopic.trim()}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Create ChatGPT Participant
              </button>
              <button
                onClick={() => {
                  console.log('🚀 Creating Google participant...');
                  handleCreateParticipant('google');
                }}
                disabled={topicSelectionMode === 'custom' && !customTopic.trim()}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Create Google Participant
              </button>
            </div>
            
            {/* Validation Message */}
            {topicSelectionMode === 'custom' && !customTopic.trim() && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                ⚠️ Please enter a custom topic before creating a participant
              </p>
            )}
            
            {/* Current Selection Summary */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
              <span className="font-semibold">Current selection:</span> 
              {topicSelectionMode === 'random' 
                ? ' Random topic from available list' 
                : ` Custom topic: "${customTopic || 'Not entered yet'}"`}
            </div>
          </div>
        </div>

        {/* Recent Participants Section */}
        {participants.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Recent Participants Created</h3>
            <div className="space-y-2">
              {participants.slice(-3).reverse().map((participant) => (
                <div 
                  key={participant.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{participant.name}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{participant.researchTopic}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      participant.assignedPlatform === 'chatgpt' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {participant.assignedPlatform.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.floor((Date.now() - participant.sessionStart.getTime()) / 60000)}m ago
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Enhanced Platform Comparison */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Platform Performance Analysis</h3>
              <div className="text-sm text-gray-500">
                Real-time metrics • Updated live
              </div>
            </div>
            
            {/* Platform Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {platformComparison.map((platform) => (
                <div key={platform.platform} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{platform.platform}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      platform.platform === 'ChatGPT' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {platform.activeCount}/{platform.participants} active
                    </span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completion:</span>
                      <span className="font-semibold text-gray-800">{platform.completionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Engagement:</span>
                      <span className="font-semibold text-gray-800">{platform.engagement}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={platformComparison} 
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="platform"
                    type="category"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    interval={0}
                    tickLine={false}
                    allowDataOverflow={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${Math.round(value)}%`}
                    allowDataOverflow={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}${name.includes('Load') || name.includes('Creativity') || name.includes('Engagement') ? '%' : ''}`,
                      name.replace('avg', 'Avg ').replace('Rate', ' Rate')
                    ]}
                  />
                  <Bar 
                    dataKey="avgCognitiveLoad" 
                    fill="#f59e0b" 
                    name="Cognitive Load"
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar 
                    dataKey="avgCreativity" 
                    fill="#8b5cf6" 
                    name="Creativity Score"
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar 
                    dataKey="engagement" 
                    fill="#10b981" 
                    name="Engagement Level"
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enhanced Cognitive Load vs Creativity Analysis */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Cognitive Load vs Creativity Correlation</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>ChatGPT</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Google</span>
                </div>
                <div className="text-xs text-gray-400">
                  • Size = Engagement Level
                </div>
              </div>
            </div>

            {/* Correlation Insights */}
            <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {scatterData.length > 0 ? 
                    Math.round(scatterData.reduce((sum, p) => sum + p.x, 0) / scatterData.length) : 0}%
                </div>
                <div className="text-xs text-gray-600">Avg Cognitive Load</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {scatterData.length > 0 ? 
                    Math.round(scatterData.reduce((sum, p) => sum + p.y, 0) / scatterData.length) : 0}
                </div>
                <div className="text-xs text-gray-600">Avg Creativity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {scatterData.length > 0 ? 
                    Math.round(scatterData.reduce((sum, p) => sum + p.z, 0) / scatterData.length) : 0}%
                </div>
                <div className="text-xs text-gray-600">Avg Engagement</div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart 
                  data={scatterData} 
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="x" 
                    name="Cognitive Load" 
                    domain={[0, 100]}
                    type="number"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    ticks={[0, 25, 50, 75, 100]}
                    allowDataOverflow={false}
                    tickCount={5}
                    interval={0}
                  />
                  <YAxis 
                    dataKey="y" 
                    name="Creativity Score" 
                    domain={[0, 100]}
                    type="number"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    ticks={[0, 25, 50, 75, 100]}
                    allowDataOverflow={false}
                    tickCount={5}
                    interval={0}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: '#9ca3af' }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}${name === 'Cognitive Load' ? '%' : ''}`, 
                      name
                    ]}
                    labelFormatter={(_, payload) => {
                      if (payload?.[0]?.payload) {
                        const data = payload[0].payload;
                        return (
                          <div>
                            <div className="font-semibold">{data.name}</div>
                            <div className="text-sm text-gray-600">
                              {data.platform} • {data.phase} • {data.sessionDuration}min
                            </div>
                            <div className="text-xs text-gray-500">{data.topic}</div>
                          </div>
                        );
                      }
                      return '';
                    }}
                  />
                  {/* Separate scatter plots for each platform with different colors */}
                  <Scatter 
                    data={scatterData.filter(d => d.platform === 'chatgpt')}
                    dataKey="y" 
                    fill="#10b981"
                    fillOpacity={0.8}
                    stroke="#059669"
                    strokeWidth={1}
                    isAnimationActive={false}
                  />
                  <Scatter 
                    data={scatterData.filter(d => d.platform === 'google')}
                    dataKey="y" 
                    fill="#3b82f6"
                    fillOpacity={0.8}
                    stroke="#2563eb"
                    strokeWidth={1}
                    isAnimationActive={false}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Participant List */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Live Participant Monitoring</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phase
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cognitive Load
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creativity Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participantData.map((participant) => {
                  const duration = Math.floor((Date.now() - participant.sessionStart.getTime()) / 60000);
                  const loadStatus = getCognitiveLoadStatus(participant.cognitiveLoadScore);
                  const LoadIcon = loadStatus.icon;

                  return (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                          <div className="text-sm text-gray-500">{participant.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          participant.assignedPlatform === 'chatgpt' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {participant.assignedPlatform === 'chatgpt' ? 'ChatGPT' : 'Google'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(participant)}`}>
                          {participant.currentPhase.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <LoadIcon className={`h-4 w-4 ${loadStatus.color}`} />
                          <span className="text-sm font-medium text-gray-900">
                            {participant.currentReading?.cognitiveLoad 
                              ? Math.round(participant.currentReading.cognitiveLoad) 
                              : participant.cognitiveLoadScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{participant.creativityScore}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {duration} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full mr-2 ${
                            participant.isActive ? 'bg-green-400' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-sm text-gray-900">
                            {participant.isActive ? 'Active' : 'Inactive'}
                          </span>
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