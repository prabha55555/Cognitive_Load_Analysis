import { Award, Brain, CheckCircle, Clock, Lightbulb, Sparkles, Target, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import React from 'react';
import { cognitiveLoadService } from '../services/cognitiveLoadService';
import { AssessmentResponse, CognitiveLoadMetrics } from '../types';
import { CreativityEvaluation } from '../services/geminiService';

interface CognitiveLoadResultsProps {
  assessmentResponses: AssessmentResponse[];
  creativityEvaluations?: CreativityEvaluation[];
  onComplete: (cognitiveLoadScore: number) => void;
  topic?: string;
  participantId?: string;
}

export const CognitiveLoadResults: React.FC<CognitiveLoadResultsProps> = ({
  assessmentResponses,
  creativityEvaluations = [],
  onComplete,
  topic = '',
  participantId = ''
}) => {
  // Guard: Check if assessmentResponses is empty
  if (!assessmentResponses || assessmentResponses.length === 0) {
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
            onClick={() => onComplete(0)}
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
