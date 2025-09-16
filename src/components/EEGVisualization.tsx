import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { EEGData } from '../types';
import { Brain, Activity } from 'lucide-react';

interface EEGVisualizationProps {
  eegData: EEGData[];
  currentReading: EEGData | null;
  participantName: string;
  connected?: boolean;
}

export const EEGVisualization: React.FC<EEGVisualizationProps> = ({
  eegData,
  currentReading,
  participantName,
  connected = false
}) => {
  // Process data for visualization with continuous time axis
  const chartData = useMemo(() => {
    if (eegData.length === 0) return [];
    
    // Take last 50 data points for visualization
    const dataPoints = eegData.slice(-50);
    
    // Create continuous time series with proper timestamps
    const processedData = dataPoints.map((reading, index) => ({
      time: index, // Sequential time points for smooth line progression
      timestamp: reading.timestamp, // Keep original timestamp for reference
      cognitiveLoad: Math.round(reading.cognitiveLoad * 10) / 10,
      theta: Math.round(reading.thetaPower * 10) / 10,
      alpha: Math.round(reading.alphaPower * 10) / 10,
      beta: Math.round(reading.betaPower * 10) / 10,
      engagement: Math.round(reading.engagement * 10) / 10
    }));
    
    return processedData;
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
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-500 animate-pulse" />
            <span className="text-sm text-green-600 font-medium">
              Live ({chartData.length} pts)
            </span>
          </div>
          {connected && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Backend</span>
            </div>
          )}
          {!connected && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Local</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Readings */}
      {currentReading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-xl ${getCognitiveLoadBg(currentReading.cognitiveLoad)} border border-opacity-20`}>
            <div className="text-center">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                COGNITIVE
              </div>
              <div className="text-xs font-medium text-gray-600 mb-2">
                Load
              </div>
              <div className={`text-2xl font-bold ${getCognitiveLoadColor(currentReading.cognitiveLoad)}`}>
                {Math.round(currentReading.cognitiveLoad)}%
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-purple-100 border border-purple-200">
            <div className="text-center">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                THETA
              </div>
              <div className="text-xs font-medium text-gray-600 mb-2">
                Power
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(currentReading.thetaPower)}
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-blue-100 border border-blue-200">
            <div className="text-center">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                ALPHA
              </div>
              <div className="text-xs font-medium text-gray-600 mb-2">
                Power
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(currentReading.alphaPower)}
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-indigo-100 border border-indigo-200">
            <div className="text-center">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                ENGAGEMENT
              </div>
              <div className="text-xs font-medium text-gray-600 mb-2">
                Level
              </div>
              <div className="text-2xl font-bold text-indigo-600">
                {Math.round(currentReading.engagement)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EEG Waveform Visualization */}
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-3">
            Cognitive Load Timeline
            <span className="text-sm text-gray-500 ml-2">
              ({chartData.length} data points)
            </span>
          </h4>
          <div className="h-64 bg-gray-50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                key={`cognitive-${chartData.length}`} // Force re-render when data changes
              >
                <XAxis 
                  dataKey="time" 
                  type="number"
                  scale="linear"
                  domain={['dataMin', 'dataMax']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip 
                  labelFormatter={(value) => `Time Point: ${value}`}
                  formatter={(value: number) => [
                    `${value.toFixed(1)}%`, 
                    'Cognitive Load'
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cognitiveLoad" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={false}
                  connectNulls={true}
                  isAnimationActive={false} // Disable animation for smoother real-time updates
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-3">
            Brain Wave Patterns
            <span className="text-sm text-gray-500 ml-2">
              (Hz Power)
            </span>
          </h4>
          <div className="h-48 bg-gray-50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                key={`brainwaves-${chartData.length}`} // Force re-render when data changes
              >
                <XAxis 
                  dataKey="time" 
                  type="number"
                  scale="linear"
                  domain={['dataMin', 'dataMax']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  domain={[0, 80]} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip 
                  labelFormatter={(value) => `Time Point: ${value}`}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}`, 
                    name.charAt(0).toUpperCase() + name.slice(1) + ' Power'
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="theta" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5} 
                  dot={false}
                  connectNulls={true}
                  isAnimationActive={false} // Disable animation for smoother real-time updates
                />
                <Line 
                  type="monotone" 
                  dataKey="alpha" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  dot={false}
                  connectNulls={true}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="beta" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={false}
                  connectNulls={true}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-8 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Theta (4-8 Hz)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Alpha (8-12 Hz)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Beta (12-30 Hz)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};