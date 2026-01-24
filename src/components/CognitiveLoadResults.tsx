import { Award, Brain, CheckCircle, Clock, Lightbulb, Sparkles, Target, TrendingDown, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { cognitiveLoadService } from '../services/cognitiveLoadService';
import { behavioralClassificationService, BehavioralClassificationResult, BehavioralFeatures, PlatformComparisonResult } from '../services/behavioralClassificationService';
import { AssessmentResponse, CognitiveLoadMetrics } from '../types';
import { CreativityEvaluation } from '../services/geminiService';

interface CognitiveLoadResultsProps {
  assessmentResponses: AssessmentResponse[];
  creativityEvaluations?: CreativityEvaluation[];
  onComplete: (cognitiveLoadScore: number) => void;
  topic?: string;
  participantId?: string;
  sessionId?: string; // Session ID for behavioral classification
  platform?: 'chatgpt' | 'google'; // Platform used during the session
}

export const CognitiveLoadResults: React.FC<CognitiveLoadResultsProps> = ({
  assessmentResponses,
  creativityEvaluations = [],
  onComplete,
  topic = '',
  participantId = '',
  sessionId = '',
  platform
}) => {
  // State for behavioral classification results
  const [behavioralResult, setBehavioralResult] = useState<BehavioralClassificationResult | null>(null);
  const [platformComparison] = useState<PlatformComparisonResult | null>(null);
  const [isLoadingBehavioral, setIsLoadingBehavioral] = useState(false);
  const [behavioralServiceAvailable, setBehavioralServiceAvailable] = useState(false);

  // Fetch behavioral classification on mount
  useEffect(() => {
    const fetchBehavioralData = async () => {
      setIsLoadingBehavioral(true);
      
      // Check if service is available
      const isAvailable = await behavioralClassificationService.checkHealth();
      setBehavioralServiceAvailable(isAvailable);
      
      if (isAvailable && sessionId) {
        // Fetch predictions for this session (returns array)
        const predictions = await behavioralClassificationService.getSessionPredictions(sessionId);
        
        // Aggregate ALL predictions instead of just showing the last one
        if (predictions && predictions.length > 0) {
          console.log(`[BEHAVIORAL] Aggregating ${predictions.length} predictions for session ${sessionId}`);
          
          // Aggregate features from all predictions - only use fields that exist in BehavioralFeatures
          const aggregatedFeatures: Partial<BehavioralFeatures> = predictions.reduce((acc, pred) => {
            if (!pred.features) return acc;
            
            return {
              mean_response_time: (acc.mean_response_time || 0) + pred.features.mean_response_time,
              median_response_time: (acc.median_response_time || 0) + pred.features.median_response_time,
              std_response_time: (acc.std_response_time || 0) + pred.features.std_response_time,
              total_clicks: (acc.total_clicks || 0) + pred.features.total_clicks,
              rage_click_count: (acc.rage_click_count || 0) + pred.features.rage_click_count,
              click_rate: (acc.click_rate || 0) + pred.features.click_rate,
              mean_cursor_speed: (acc.mean_cursor_speed || 0) + pred.features.mean_cursor_speed,
              trajectory_deviation: (acc.trajectory_deviation || 0) + pred.features.trajectory_deviation,
              total_idle_time: (acc.total_idle_time || 0) + pred.features.total_idle_time,
              revisit_ratio: (acc.revisit_ratio || 0) + pred.features.revisit_ratio,
              path_linearity: (acc.path_linearity || 0) + pred.features.path_linearity,
              sections_visited: Math.max(acc.sections_visited || 0, pred.features.sections_visited),
              total_session_time: (acc.total_session_time || 0) + pred.features.total_session_time,
              active_time_ratio: (acc.active_time_ratio || 0) + pred.features.active_time_ratio,
              scroll_depth: Math.max(acc.scroll_depth || 0, pred.features.scroll_depth)
            };
          }, {} as Partial<BehavioralFeatures>);
          
          // Average out the additive metrics
          const count = predictions.length;
          if (aggregatedFeatures.mean_response_time !== undefined) aggregatedFeatures.mean_response_time /= count;
          if (aggregatedFeatures.median_response_time !== undefined) aggregatedFeatures.median_response_time /= count;
          if (aggregatedFeatures.std_response_time !== undefined) aggregatedFeatures.std_response_time /= count;
          if (aggregatedFeatures.click_rate !== undefined) aggregatedFeatures.click_rate /= count;
          if (aggregatedFeatures.mean_cursor_speed !== undefined) aggregatedFeatures.mean_cursor_speed /= count;
          if (aggregatedFeatures.trajectory_deviation !== undefined) aggregatedFeatures.trajectory_deviation /= count;
          if (aggregatedFeatures.revisit_ratio !== undefined) aggregatedFeatures.revisit_ratio /= count;
          if (aggregatedFeatures.path_linearity !== undefined) aggregatedFeatures.path_linearity /= count;
          if (aggregatedFeatures.active_time_ratio !== undefined) aggregatedFeatures.active_time_ratio /= count;
          
          // Determine overall cognitive load level from all predictions
          const loadLevels = predictions.map(p => p.cognitive_load_level);
          const highCount = loadLevels.filter(l => l === 'High' || l === 'Very High').length;
          const moderateCount = loadLevels.filter(l => l === 'Moderate').length;
          const lowCount = loadLevels.filter(l => l === 'Low').length;
          
          let overallLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
          if (highCount > moderateCount && highCount > lowCount) {
            overallLevel = 'High';
          } else if (moderateCount >= highCount && moderateCount > lowCount) {
            overallLevel = 'Moderate';
          } else {
            overallLevel = 'Low';
          }
          
          // Use latest prediction as base but with aggregated features
          const latestPrediction = predictions[predictions.length - 1];
          const aggregatedResult: BehavioralClassificationResult = {
            ...latestPrediction,
            features: aggregatedFeatures as BehavioralFeatures,
            cognitive_load_level: overallLevel,
            confidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / count
          };
          
          console.log('[BEHAVIORAL] Aggregated result:', {
            totalPredictions: count,
            totalClicks: aggregatedFeatures.total_clicks,
            overallLevel,
            avgConfidence: aggregatedResult.confidence
          });
          
          setBehavioralResult(aggregatedResult);
        }
        
        // Note: Platform comparison endpoint not yet implemented in Phase 4
        // Will be added in Phase 4.3 Admin Dashboard Enhancement
      }
      
      setIsLoadingBehavioral(false);
    };
    
    fetchBehavioralData();
  }, [sessionId]);
  // Guard: Check if assessmentResponses is empty
  if (!assessmentResponses || assessmentResponses.length === 0) {
    console.error('==========================================');
    console.error('❌ COGNITIVE LOAD RESULTS - NO ASSESSMENT DATA');
    console.error('assessmentResponses:', assessmentResponses);
    console.error('Is undefined?:', assessmentResponses === undefined);
    console.error('Is empty array?:', assessmentResponses?.length === 0);
    console.error('THIS WILL CALL onComplete(0) AND RESET COGNITIVE LOAD SCORE!');
    console.error('==========================================');
    
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-xl text-center bg-white rounded-2xl shadow-xl p-8">
          <div className="inline-block p-3 bg-gray-100 rounded-full mb-4">
            <Brain className="h-10 w-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Assessment Results</h2>
          <p className="text-gray-600 mb-6">
            Please complete the reading and note-taking phase first to generate assessment questions.
          </p>
          <button
            onClick={() => {
              console.error('🔴 GO BACK BUTTON CLICKED - Calling onComplete(0)');
              onComplete(0);
            }}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Extract participant info from the first assessment response if not provided
  const actualParticipantId = participantId || assessmentResponses[0]?.participantId || '';
  
  // Get timestamps from assessment responses (use startTime from responses)
  const timestamps = assessmentResponses
    .map(r => r.startTime)
    .filter(t => t instanceof Date);

  // Create minimal learning data since we're skipping the learning phase
  const metrics: CognitiveLoadMetrics = cognitiveLoadService.calculateCognitiveLoad(
    {
      participantId: actualParticipantId,
      topic: topic,
      startTime: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : new Date(),
      totalLearningTime: 0,
      chatbotInteractions: 0,
      questionsViewed: [],
      clarificationsAsked: [],
      interactionTimestamps: timestamps
    },
    assessmentResponses
  );

  console.log('==========================================');
  console.log('📊 COGNITIVE LOAD RESULTS - METRICS CALCULATED');
  console.log('Overall Cognitive Load:', metrics.overallCognitiveLoad);
  console.log('Full metrics:', metrics);
  console.log('==========================================');

  const recommendations = cognitiveLoadService.getRecommendations(metrics);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Low': return 'from-green-500 to-emerald-600';
      case 'Moderate': return 'from-blue-500 to-indigo-600';
      case 'High': return 'from-orange-500 to-red-500';
      case 'Very High': return 'from-red-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Low': return <TrendingDown className="h-12 w-12" />;
      case 'Moderate': return <Target className="h-12 w-12" />;
      case 'High': return <TrendingUp className="h-12 w-12" />;
      case 'Very High': return <TrendingUp className="h-12 w-12" />;
      default: return <Brain className="h-12 w-12" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white rounded-full shadow-xl mb-4">
            <Brain className="h-16 w-16 text-purple-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-800 mb-2">Cognitive Load Analysis</h1>
          <p className="text-xl text-gray-600">Complete Assessment Results</p>
        </div>

        {/* Main Cognitive Load Score */}
        <div className={`bg-gradient-to-r ${getCategoryColor(metrics.cognitiveLoadCategory)} rounded-3xl shadow-2xl p-8 mb-8 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 opacity-90">Overall Cognitive Load</h2>
              <div className="flex items-baseline space-x-4">
                <span className="text-7xl font-black">{Math.round(metrics.overallCognitiveLoad)}</span>
                <span className="text-3xl font-bold opacity-75">/100</span>
              </div>
              <p className="text-2xl font-bold mt-4">{metrics.cognitiveLoadCategory} Load</p>
            </div>
            <div className="flex-shrink-0">
              {getCategoryIcon(metrics.cognitiveLoadCategory)}
            </div>
          </div>
        </div>

        {/* Behavioral Classification Results - Requirements: 7.2 */}
        {behavioralServiceAvailable && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Behavioral Analysis</h3>
              {platform && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  platform === 'chatgpt' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {platform === 'chatgpt' ? 'ChatGPT' : 'Google Search'}
                </span>
              )}
            </div>
            
            {isLoadingBehavioral ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Analyzing behavioral patterns...</span>
              </div>
            ) : behavioralResult ? (
              <div className="space-y-4">
                {/* Behavioral Cognitive Load Level */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium text-gray-700">Behavioral Cognitive Load</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      behavioralResult.cognitive_load_level === 'Low' ? 'bg-green-100 text-green-700' :
                      behavioralResult.cognitive_load_level === 'Moderate' ? 'bg-blue-100 text-blue-700' :
                      behavioralResult.cognitive_load_level === 'High' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {behavioralResult.cognitive_load_level}
                    </span>
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-gray-700">Classification Confidence</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{ width: `${behavioralResult.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-purple-600">
                      {Math.round(behavioralResult.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Behavioral Features Summary */}
                {behavioralResult.features && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500 mb-1">Response Time</div>
                      <div className="text-lg font-bold text-gray-700">
                        {behavioralResult.features.mean_response_time.toFixed(1)}s
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500 mb-1">Total Clicks</div>
                      <div className="text-lg font-bold text-gray-700">
                        {behavioralResult.features.total_clicks}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500 mb-1">Rage Clicks</div>
                      <div className={`text-lg font-bold ${
                        behavioralResult.features.rage_click_count > 2 ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {behavioralResult.features.rage_click_count}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500 mb-1">Active Time</div>
                      <div className="text-lg font-bold text-gray-700">
                        {Math.round(behavioralResult.features.active_time_ratio * 100)}%
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500 mb-1">Sections Visited</div>
                      <div className="text-lg font-bold text-gray-700">
                        {behavioralResult.features.sections_visited}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-xs text-gray-500 mb-1">Scroll Depth</div>
                      <div className="text-lg font-bold text-gray-700">
                        {Math.round(behavioralResult.features.scroll_depth * 100)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Brain className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No behavioral data available for this session</p>
              </div>
            )}
          </div>
        )}

        {/* Platform Comparison - Requirements: 7.2 */}
        {platformComparison && platformComparison.sample_sizes.chatgpt > 0 && platformComparison.sample_sizes.google > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-cyan-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Platform Comparison</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* ChatGPT Stats */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                <div className="text-center">
                  <div className="text-sm font-medium text-emerald-700 mb-2">ChatGPT</div>
                  <div className="text-3xl font-bold text-emerald-600">
                    {Math.round(platformComparison.chatgpt_mean_load)}
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">
                    Mean Cognitive Load
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {platformComparison.sample_sizes.chatgpt} sessions
                  </div>
                </div>
              </div>

              {/* Google Stats */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="text-center">
                  <div className="text-sm font-medium text-blue-700 mb-2">Google Search</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(platformComparison.google_mean_load)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Mean Cognitive Load
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {platformComparison.sample_sizes.google} sessions
                  </div>
                </div>
              </div>
            </div>

            {/* Statistical Significance */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
              <span className="text-sm text-gray-600">Statistical Significance: </span>
              <span className={`font-bold ${
                platformComparison.statistical_significance < 0.05 ? 'text-green-600' : 'text-gray-600'
              }`}>
                p = {platformComparison.statistical_significance.toFixed(4)}
                {platformComparison.statistical_significance < 0.05 && ' (Significant)'}
              </span>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Assessment Phase Metrics */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Assessment Phase</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-700">Total Time</span>
                </div>
                <span className="text-xl font-bold text-blue-600">
                  {formatTime(metrics.assessmentPhase.totalTime)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-700">Questions Answered</span>
                </div>
                <span className="text-xl font-bold text-purple-600">
                  {metrics.assessmentPhase.questionsAnswered}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-700">Avg Time/Question</span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {formatTime(Math.round(metrics.assessmentPhase.averageTimePerQuestion))}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Award className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-gray-700">Accuracy</span>
                </div>
                <span className="text-xl font-bold text-orange-600">
                  {Math.round(metrics.assessmentPhase.accuracy)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Recommendations</h3>
            </div>
            
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creativity Assessment Results */}
        {creativityEvaluations && creativityEvaluations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Creativity Assessment</h3>
            </div>
            
            <div className="space-y-6">
              {creativityEvaluations.map((evaluation, idx) => (
                <div key={idx} className="p-6 border-2 border-purple-100 rounded-2xl bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                  {/* Question Type Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5 text-purple-600" />
                      <span className="font-bold text-purple-800 text-lg">
                        Question {idx + 1}
                      </span>
                    </div>
                    <div className="px-4 py-2 bg-purple-200 rounded-full">
                      <span className="font-bold text-purple-800">
                        Score: {evaluation.score}/100
                      </span>
                    </div>
                  </div>

                  {/* Evaluation Scores Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-white rounded-xl border border-purple-100">
                      <div className="text-sm text-gray-600 mb-1">Relevance</div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                            style={{ width: `${evaluation.relevanceScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-blue-600">{evaluation.relevanceScore}%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-purple-100">
                      <div className="text-sm text-gray-600 mb-1">Creativity</div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full"
                            style={{ width: `${evaluation.creativityScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-purple-600">{evaluation.creativityScore}%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-purple-100">
                      <div className="text-sm text-gray-600 mb-1">Depth</div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full"
                            style={{ width: `${evaluation.depthScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-emerald-600">{evaluation.depthScore}%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-purple-100">
                      <div className="text-sm text-gray-600 mb-1">Coherence</div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full"
                            style={{ width: `${evaluation.coherenceScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-amber-600">{evaluation.coherenceScore}%</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Feedback */}
                  <div className="p-4 bg-white rounded-xl border border-purple-100 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-gray-700">AI Feedback</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{evaluation.feedback}</p>
                  </div>

                  {/* Cognitive Load Indicators */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center border border-blue-200">
                      <Zap className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <div className="text-xs text-blue-600 font-medium mb-1">Processing Speed</div>
                      <div className="text-lg font-bold text-blue-700">{evaluation.cognitiveLoadIndicators.processingSpeed}/100</div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl text-center border border-purple-200">
                      <Brain className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                      <div className="text-xs text-purple-600 font-medium mb-1">Mental Effort</div>
                      <div className="text-lg font-bold text-purple-700">{evaluation.cognitiveLoadIndicators.mentalEffort}/100</div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl text-center border border-orange-200">
                      <Target className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                      <div className="text-xs text-orange-600 font-medium mb-1">Cognitive Strain</div>
                      <div className="text-lg font-bold text-orange-700">{evaluation.cognitiveLoadIndicators.cognitiveStrain}/100</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Creativity Summary */}
            <div className="mt-6 p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="text-sm text-purple-700 font-medium">Average Creativity Score</div>
                    <div className="text-3xl font-bold text-purple-800">
                      {Math.round(creativityEvaluations.reduce((sum, e) => sum + e.score, 0) / creativityEvaluations.length)}/100
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-purple-700 font-medium mb-1">Overall Assessment</div>
                  <div className="text-xl font-bold text-purple-800">
                    {(() => {
                      const avgScore = creativityEvaluations.reduce((sum, e) => sum + e.score, 0) / creativityEvaluations.length;
                      if (avgScore >= 80) return '🌟 Excellent';
                      if (avgScore >= 65) return '✨ Very Good';
                      if (avgScore >= 50) return '💫 Good';
                      return '⭐ Developing';
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Performance Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <Award className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">Total Score</p>
              <p className="text-3xl font-bold text-purple-600">
                {Math.round(metrics.assessmentPhase.totalScore)}
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">Understanding Level</p>
              <p className="text-3xl font-bold text-green-600">
                {metrics.assessmentPhase.accuracy > 80 ? 'Excellent' :
                 metrics.assessmentPhase.accuracy > 60 ? 'Good' :
                 metrics.assessmentPhase.accuracy > 40 ? 'Fair' : 'Needs Improvement'}
              </p>
            </div>
          </div>
        </div>

        {/* Complete Button */}
        <div className="text-center">
          <button
            onClick={() => {
              console.log('==========================================');
              console.log('✅ COMPLETE BUTTON CLICKED IN COGNITIVE LOAD RESULTS');
              console.log('Metrics object:', metrics);
              console.log('Overall Cognitive Load:', metrics.overallCognitiveLoad);
              console.log('Type:', typeof metrics.overallCognitiveLoad);
              console.log('Is valid number?:', !isNaN(metrics.overallCognitiveLoad));
              console.log('Passing to onComplete:', metrics.overallCognitiveLoad);
              console.log('==========================================');
              onComplete(metrics.overallCognitiveLoad);
            }}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-2xl transform hover:scale-105"
          >
            Complete & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
