import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { EEGData } from '../types';
import { Brain, Activity, TrendingUp } from 'lucide-react';

interface EEGVisualizationProps {
  eegData: EEGData[];
  currentReading: EEGData | null;
  participantName: string;
}

export const EEGVisualization: React.FC<EEGVisualizationProps> = ({
  eegData,
  currentReading,
  participantName
}) => {
  // Process data for visualization
  const chartData = useMemo(() => {
    return eegData.slice(-50).map((reading, index) => ({
      time: index,
      cognitiveLoad: reading.cognitiveLoad,
      theta: reading.thetaPower,
      alpha: reading.alphaPower,
      beta: reading.betaPower,
      engagement: reading.engagement
    }));
  }, [eegData]);

  const getCognitiveLoadColor = (load: number) => {
    if (load < 30) return 'text-green-600';
    if (load < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCognitiveLoadBg = (load: number) => {
    if (load < 30) return 'bg-green-100';
    if (load < 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-800">
            EEG Monitor - {participantName}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-600 font-medium">Live</span>
        </div>
      </div>

      {/* Current Readings */}
      {currentReading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${getCognitiveLoadBg(currentReading.cognitiveLoad)}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Cognitive Load</span>
              <TrendingUp className={`h-4 w-4 ${getCognitiveLoadColor(currentReading.cognitiveLoad)}`} />
            </div>
            <p className={`text-2xl font-bold ${getCognitiveLoadColor(currentReading.cognitiveLoad)}`}>
              {Math.round(currentReading.cognitiveLoad)}%
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-purple-100">
            <span className="text-sm font-medium text-gray-600">Theta Power</span>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(currentReading.thetaPower)}
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-100">
            <span className="text-sm font-medium text-gray-600">Alpha Power</span>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(currentReading.alphaPower)}
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-indigo-100">
            <span className="text-sm font-medium text-gray-600">Engagement</span>
            <p className="text-2xl font-bold text-indigo-600">
              {Math.round(currentReading.engagement)}%
            </p>
          </div>
        </div>
      )}

      {/* EEG Waveform Visualization */}
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-3">Cognitive Load Timeline</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${value}`}
                  formatter={(value: number, name: string) => [
                    `${Math.round(value)}${name === 'cognitiveLoad' || name === 'engagement' ? '%' : ''}`, 
                    name === 'cognitiveLoad' ? 'Cognitive Load' : 
                    name === 'engagement' ? 'Engagement' : 
                    name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="cognitiveLoad" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-3">Brain Wave Patterns</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 80]} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${value}`}
                  formatter={(value: number, name: string) => [
                    Math.round(value), 
                    name.charAt(0).toUpperCase() + name.slice(1) + ' Power'
                  ]}
                />
                <Line type="monotone" dataKey="theta" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="alpha" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="beta" stroke="#10b981" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-600">Theta</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Alpha</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Beta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};