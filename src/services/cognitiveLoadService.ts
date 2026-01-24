// Cognitive Load Calculation Service
// Updated to use behavioral classification backend with fallback
// Requirements: 9.4 - Handle fallback when service unavailable
import { AssessmentResponse, CognitiveLoadMetrics, LearningPhaseData } from '../types';
import { behavioralClassificationService, BehavioralClassificationResult } from './behavioralClassificationService';
import { logger } from '../utils/logger';

class CognitiveLoadService {
  private static instance: CognitiveLoadService;
  private behavioralServiceAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 60000; // Check every 60 seconds

  static getInstance(): CognitiveLoadService {
    if (!CognitiveLoadService.instance) {
      CognitiveLoadService.instance = new CognitiveLoadService();
    }
    return CognitiveLoadService.instance;
  }

  /**
   * Check if behavioral service is available (with caching)
   */
  private async checkBehavioralServiceHealth(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.behavioralServiceAvailable;
    }
    
    this.behavioralServiceAvailable = await behavioralClassificationService.checkHealth();
    this.lastHealthCheck = now;
    
    if (this.behavioralServiceAvailable) {
      logger.info('Behavioral classification service is available');
    } else {
      logger.warn('Behavioral classification service unavailable, using local fallback');
    }
    
    return this.behavioralServiceAvailable;
  }

  /**
   * Get cognitive load classification from behavioral service
   * Falls back to local calculation if service unavailable
   * Requirements: 9.4
   */
  async getBehavioralClassification(
    sessionId: string
  ): Promise<BehavioralClassificationResult | null> {
    const isAvailable = await this.checkBehavioralServiceHealth();
    
    if (!isAvailable) {
      logger.info('Using local cognitive load calculation (behavioral service unavailable)');
      return null;
    }
    
    try {
      const results = await behavioralClassificationService.getSessionPredictions(sessionId);
      const result = results.length > 0 ? results[results.length - 1] : null;
      if (result) {
        logger.info(`Behavioral classification: ${result.cognitive_load_level} (confidence: ${result.confidence})`);
      }
      return result;
    } catch (error) {
      logger.error('Failed to get behavioral classification', error);
      return null;
    }
  }

  /**
   * Calculate cognitive load based on learning phase and assessment phase data
   * This is the local fallback method when behavioral service is unavailable
   */
  calculateCognitiveLoad(
    learningData: LearningPhaseData,
    assessmentResponses: AssessmentResponse[]
  ): CognitiveLoadMetrics {
    console.log('=== Cognitive Load Calculation Started (Local Fallback) ===');
    console.log('Learning Data:', learningData);
    console.log('Assessment Responses:', assessmentResponses);

    // Calculate learning phase metrics
    const learningMetrics = this.calculateLearningMetrics(learningData);
    
    // Calculate assessment phase metrics
    const assessmentMetrics = this.calculateAssessmentMetrics(assessmentResponses);
    
    console.log('Learning Metrics:', learningMetrics);
    console.log('Assessment Metrics:', assessmentMetrics);

    // Calculate overall cognitive load score (0-100)
    const overallCognitiveLoad = this.calculateOverallScore(learningMetrics, assessmentMetrics);
    
    // Categorize cognitive load
    const cognitiveLoadCategory = this.categorizeCognitiveLoad(overallCognitiveLoad);

    console.log('Overall Cognitive Load:', overallCognitiveLoad);
    console.log('Category:', cognitiveLoadCategory);
    console.log('=== Cognitive Load Calculation Complete ===');

    return {
      participantId: learningData.participantId,
      topic: learningData.topic,
      learningPhase: learningMetrics,
      assessmentPhase: assessmentMetrics,
      overallCognitiveLoad,
      cognitiveLoadCategory,
      timestamp: new Date()
    };
  }

  /**
   * Calculate cognitive load with behavioral service integration
   * Attempts to use behavioral service first, falls back to local calculation
   * Requirements: 9.4
   */
  async calculateCognitiveLoadWithBehavioral(
    learningData: LearningPhaseData,
    assessmentResponses: AssessmentResponse[],
    sessionId?: string
  ): Promise<CognitiveLoadMetrics> {
    // Try behavioral service first if session ID is provided
    if (sessionId) {
      const behavioralResult = await this.getBehavioralClassification(sessionId);
      
      if (behavioralResult) {
        // Convert behavioral result to CognitiveLoadMetrics format
        const behavioralScore = behavioralClassificationService.levelToScore(
          behavioralResult.cognitive_load_level
        );
        
        // Calculate local metrics for additional context
        const learningMetrics = this.calculateLearningMetrics(learningData);
        const assessmentMetrics = this.calculateAssessmentMetrics(assessmentResponses);
        
        // Blend behavioral and assessment-based scores (70% behavioral, 30% assessment)
        const assessmentScore = this.calculateOverallScore(learningMetrics, assessmentMetrics);
        const blendedScore = behavioralScore * 0.7 + assessmentScore * 0.3;
        
        return {
          participantId: learningData.participantId,
          topic: learningData.topic,
          learningPhase: learningMetrics,
          assessmentPhase: assessmentMetrics,
          overallCognitiveLoad: blendedScore,
          cognitiveLoadCategory: this.categorizeCognitiveLoad(blendedScore),
          timestamp: new Date()
        };
      }
    }
    
    // Fallback to local calculation
    return this.calculateCognitiveLoad(learningData, assessmentResponses);
  }

  /**
   * Calculate learning phase metrics
   */
  private calculateLearningMetrics(data: LearningPhaseData) {
    const totalTime = data.totalLearningTime;
    const interactionCount = data.chatbotInteractions;
    const averageInteractionTime = interactionCount > 0 
      ? totalTime / interactionCount 
      : 0;
    const clarificationRequests = data.clarificationsAsked.length;

    return {
      totalTime,
      interactionCount,
      averageInteractionTime,
      clarificationRequests
    };
  }

  /**
   * Calculate assessment phase metrics
   */
  private calculateAssessmentMetrics(responses: AssessmentResponse[]) {
    if (!responses || responses.length === 0) {
      return {
        totalTime: 0,
        averageTimePerQuestion: 0,
        questionsAnswered: 0,
        descriptiveQuestionsTime: 0,
        totalScore: 0,
        accuracy: 0
      };
    }

    const questionsAnswered = responses.length;
    const totalTime = responses.reduce((sum, r) => sum + r.timeTaken, 0);
    const averageTimePerQuestion = questionsAnswered > 0 
      ? totalTime / questionsAnswered 
      : 0;
    
    // Calculate time spent on descriptive questions
    const descriptiveQuestionsTime = responses
      .filter(r => r.timeTaken > 60) // Assuming descriptive questions take longer
      .reduce((sum, r) => sum + r.timeTaken, 0);

    // Use earnedPoints if available, otherwise use score
    const totalScore = responses.reduce((sum, r) => sum + (r.earnedPoints ?? r.score), 0);
    
    // Calculate max possible score based on points field if available
    const maxPossibleScore = responses.reduce((sum, r) => {
      return sum + (r.points ?? 10); // Use actual points or default to 10
    }, 0);
    
    const accuracy = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    console.log('Assessment metrics:', {
      questionsAnswered,
      totalTime,
      totalScore,
      maxPossibleScore,
      accuracy
    });

    return {
      totalTime,
      averageTimePerQuestion,
      questionsAnswered,
      descriptiveQuestionsTime,
      totalScore,
      accuracy
    };
  }

  /**
   * Calculate overall cognitive load score
   * Higher score = Higher cognitive load
   */
  private calculateOverallScore(
    learningMetrics: any,
    assessmentMetrics: any
  ): number {
    // NEW FORMULA: Based on research showing optimal cognitive load is 40-60%
    // Start with a baseline of 50% (average cognitive load)
    let baseScore = 50;
    
    // Factor 1: Accuracy Impact (-20 to +20 points)
    // High accuracy = lower cognitive load (material was easy to understand)
    // Low accuracy = higher cognitive load (struggled with material)
    const accuracy = assessmentMetrics.accuracy || 0;
    const accuracyImpact = (100 - accuracy) * 0.4; // 0-40 points based on errors
    
    // Factor 2: Time per Question Impact (-15 to +25 points)
    // Very fast (<20s) = might indicate guessing = moderate load
    // Normal (20-60s) = comfortable processing
    // Slow (>60s) = higher cognitive effort required
    const avgTime = assessmentMetrics.averageTimePerQuestion || 30;
    let timeImpact = 0;
    if (avgTime < 15) {
      timeImpact = 10; // Too fast - might be guessing or low engagement
    } else if (avgTime < 30) {
      timeImpact = -5; // Quick but thoughtful - low load
    } else if (avgTime < 60) {
      timeImpact = 5; // Normal range
    } else if (avgTime < 120) {
      timeImpact = 15; // Taking longer - moderate load
    } else {
      timeImpact = 25; // Very slow - high cognitive effort
    }
    
    // Factor 3: Learning/Interaction Impact (0 to +15 points)
    // More clarifications needed = higher load
    const clarificationImpact = Math.min(15, learningMetrics.clarificationRequests * 3);
    
    // Factor 4: Question Completion Consistency
    // If they took very different times on questions, it indicates variable difficulty
    const timeVariance = assessmentMetrics.descriptiveQuestionsTime > 0 
      ? Math.min(10, (assessmentMetrics.descriptiveQuestionsTime / assessmentMetrics.totalTime) * 20)
      : 0;
    
    // Calculate final score
    const finalScore = baseScore + accuracyImpact + timeImpact + clarificationImpact + timeVariance;
    
    // Ensure score is within 0-100 range
    const clampedScore = Math.min(100, Math.max(0, finalScore));
    
    console.log('[COGNITIVE LOAD] Score calculation breakdown:');
    console.log('  Base Score: 50');
    console.log('  Accuracy Impact:', accuracyImpact.toFixed(2), `(accuracy: ${accuracy}%)`);
    console.log('  Time Impact:', timeImpact.toFixed(2), `(avg time: ${avgTime.toFixed(1)}s)`);
    console.log('  Clarification Impact:', clarificationImpact.toFixed(2));
    console.log('  Time Variance Impact:', timeVariance.toFixed(2));
    console.log('  --------------------------------');
    console.log('  Final Score (0-100):', clampedScore.toFixed(2));
    
    return Math.round(clampedScore);
  }

  /**
   * Categorize cognitive load level based on research
   * Optimal cognitive load for learning is 40-60% (manageable load)
   * Below 40% = Under-stimulated (too easy)
   * 40-60% = Optimal learning zone
   * 60-75% = Challenging but manageable
   * Above 75% = Overloaded
   */
  private categorizeCognitiveLoad(score: number): 'Low' | 'Moderate' | 'High' | 'Very High' {
    if (score < 40) return 'Low';        // Under 40% - material was easy
    if (score < 60) return 'Moderate';   // 40-60% - optimal learning zone
    if (score < 75) return 'High';       // 60-75% - challenging
    return 'Very High';                   // 75%+ - potentially overloaded
  }

  /**
   * Get recommendations based on cognitive load
   */
  getRecommendations(metrics: CognitiveLoadMetrics): string[] {
    const recommendations: string[] = [];
    const accuracy = metrics.assessmentPhase.accuracy;

    console.log('Generating recommendations - Accuracy:', accuracy, 'Cognitive Load:', metrics.overallCognitiveLoad);

    // Accuracy-based recommendations (MOST IMPORTANT)
    if (accuracy < 30) {
      recommendations.push('⚠️ Critical: Your assessment score is very low. Please review all core concepts thoroughly.');
      recommendations.push('📚 Start with the fundamentals and build your understanding step by step.');
      recommendations.push('💡 Consider seeking additional help or resources to master this topic.');
    } else if (accuracy < 50) {
      recommendations.push('⚠️ Your assessment performance indicates significant gaps in understanding.');
      recommendations.push('📚 Review the learning material again, focusing on areas where you struggled.');
      recommendations.push('💭 Take detailed notes and try to explain concepts in your own words.');
    } else if (accuracy < 70) {
      recommendations.push('📖 Your understanding is developing but needs improvement.');
      recommendations.push('🎯 Focus on the specific areas where you made mistakes.');
      recommendations.push('✍️ Practice with additional examples to strengthen your knowledge.');
    } else if (accuracy < 85) {
      recommendations.push('✅ Good performance! You have a solid grasp of the material.');
      recommendations.push('🔍 Review any questions you missed to fill in the remaining gaps.');
      recommendations.push('📈 You\'re on the right track - keep up the good work!');
    } else {
      recommendations.push('🌟 Excellent performance! You demonstrate strong understanding of the material.');
      recommendations.push('🚀 Consider exploring more advanced topics in this area.');
      recommendations.push('👥 You might be ready to teach others or take on more challenging problems.');
    }

    // Cognitive load category recommendations
    if (metrics.cognitiveLoadCategory === 'Very High') {
      recommendations.push('🧠 Very high cognitive load detected. The material may be too complex or presented inefficiently.');
      recommendations.push('⏸️ Break down the topic into smaller chunks and take more frequent breaks.');
    } else if (metrics.cognitiveLoadCategory === 'High') {
      recommendations.push('🧠 High cognitive load indicates challenging material. This is normal for complex topics.');
      recommendations.push('📝 Use multiple learning resources and practice active recall.');
    } else if (metrics.cognitiveLoadCategory === 'Moderate') {
      recommendations.push('✨ Moderate cognitive load suggests optimal learning conditions.');
      recommendations.push('👍 Continue with your current learning approach.');
    } else {
      recommendations.push('😊 Low cognitive load - you may be ready for more challenging material.');
      recommendations.push('🎓 Consider exploring advanced topics or helping others learn.');
    }

    // Time-based recommendations
    if (metrics.assessmentPhase.averageTimePerQuestion > 180) {
      recommendations.push('⏱️ You took considerable time per question. This may indicate uncertainty.');
      recommendations.push('🎯 Practice time-limited recall to improve confidence and speed.');
    } else if (metrics.assessmentPhase.averageTimePerQuestion < 30) {
      recommendations.push('⚡ You answered very quickly. Ensure you\'re reading questions carefully.');
    }

    // Clarification-based recommendations
    if (metrics.learningPhase.clarificationRequests > 10) {
      recommendations.push('❓ High number of clarifications suggests the material needs better structure.');
      recommendations.push('📖 Try pre-reading summaries before detailed study.');
    } else if (metrics.learningPhase.clarificationRequests === 0 && accuracy < 70) {
      recommendations.push('💬 Consider asking more questions during learning to clarify concepts.');
    }

    console.log('Generated recommendations:', recommendations);

    return recommendations;
  }

  /**
   * Compare cognitive load across multiple topics
   */
  compareTopics(metrics: CognitiveLoadMetrics[]): {
    easiestTopic: string;
    hardestTopic: string;
    averageLoad: number;
  } {
    if (metrics.length === 0) {
      return {
        easiestTopic: 'N/A',
        hardestTopic: 'N/A',
        averageLoad: 0
      };
    }

    const sorted = [...metrics].sort((a, b) => a.overallCognitiveLoad - b.overallCognitiveLoad);
    const averageLoad = metrics.reduce((sum, m) => sum + m.overallCognitiveLoad, 0) / metrics.length;

    return {
      easiestTopic: sorted[0].topic,
      hardestTopic: sorted[sorted.length - 1].topic,
      averageLoad
    };
  }
}

export const cognitiveLoadService = CognitiveLoadService.getInstance();
