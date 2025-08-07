import React, { useState } from 'react';
import { mockParticipants } from '../data/mockData';
import { useEEGStream } from '../hooks/useEEGStream';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Users, Brain, TrendingUp, Download, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import { Participant } from '../types';

export const AdminDashboard: React.FC = () => {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

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
        participantData.filter(p => p.assignedPlatform === 'chatgpt').length,
      avgCreativity: participantData
        .filter(p => p.assignedPlatform === 'chatgpt')
        .reduce((sum, p) => sum + p.creativityScore, 0) / 
        participantData.filter(p => p.assignedPlatform === 'chatgpt').length,
    },
    {
      platform: 'Google',
      participants: participantData.filter(p => p.assignedPlatform === 'google').length,
      avgCognitiveLoad: participantData
        .filter(p => p.assignedPlatform === 'google')
        .reduce((sum, p) => sum + p.cognitiveLoadScore, 0) / 
        participantData.filter(p => p.assignedPlatform === 'google').length,
      avgCreativity: participantData
        .filter(p => p.assignedPlatform === 'google')
        .reduce((sum, p) => sum + p.creativityScore, 0) / 
        participantData.filter(p => p.assignedPlatform === 'google').length,
    }
  ];

  const scatterData = participantData.map(p => ({
    x: p.cognitiveLoadScore,
    y: p.creativityScore,
    name: p.name,
    platform: p.assignedPlatform
  }));

  const getStatusColor = (participant: Participant) => {
    if (!participant.isActive) return 'text-gray-500 bg-gray-100';
    switch (participant.currentPhase) {
      case 'research': return 'text-blue-600 bg-blue-100';
      case 'creativity_test': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
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
                <p className="text-sm text-gray-500">EEG Cognitive Load vs Creativity Study</p>
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
                <p className="text-3xl font-bold text-blue-600">{participantData.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-3xl font-bold text-green-600">
                  {participantData.filter(p => p.isActive).length}
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
                  {Math.round(participantData.reduce((sum, p) => sum + p.cognitiveLoadScore, 0) / participantData.length)}%
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
                  {Math.round(participantData.reduce((sum, p) => sum + p.creativityScore, 0) / participantData.length)}
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Platform Comparison */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgCognitiveLoad" fill="#f59e0b" name="Avg Cognitive Load" />
                  <Bar dataKey="avgCreativity" fill="#8b5cf6" name="Avg Creativity Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cognitive Load vs Creativity Scatter */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cognitive Load vs Creativity</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={scatterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" name="Cognitive Load" unit="%" />
                  <YAxis dataKey="y" name="Creativity Score" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [value, name === 'x' ? 'Cognitive Load' : 'Creativity Score']}
                    labelFormatter={(label, payload) => 
                      payload?.[0]?.payload?.name ? `${payload[0].payload.name} (${payload[0].payload.platform})` : ''
                    }
                  />
                  <Scatter 
                    dataKey="y" 
                    fill="#3b82f6"
                    fillOpacity={0.6}
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