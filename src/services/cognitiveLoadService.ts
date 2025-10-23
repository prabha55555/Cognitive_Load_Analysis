// Cognitive Load Calculation Service
import { AssessmentResponse, CognitiveLoadMetrics, LearningPhaseData } from '../types';

class CognitiveLoadService {
  private static instance: CognitiveLoadService;

  static getInstance(): CognitiveLoadService {
    if (!CognitiveLoadService.instance) {
      CognitiveLoadService.instance = new CognitiveLoadService();
    }
    return CognitiveLoadService.instance;
  }

  /**
   * Calculate cognitive load based on learning phase and assessment phase data
   */
  calculateCognitiveLoad(
    learningData: LearningPhaseData,
    assessmentResponses: AssessmentResponse[]
  ): CognitiveLoadMetrics {
    console.log('=== Cognitive Load Calculation Started ===');
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
    // Normalize learning time (assuming 300-1800 seconds is typical range)
    const learningTimeScore = this.normalizeValue(
      learningMetrics.totalTime,
      300,  // min expected time (5 minutes)
      1800  // max expected time (30 minutes)
    );

    // Normalize interaction count (more interactions = more confusion = higher load)
    const interactionScore = this.normalizeValue(
      learningMetrics.interactionCount,
      0,   // min interactions
      20   // max expected interactions
    );

    // Normalize clarification requests (more clarifications = higher load)
    const clarificationScore = this.normalizeValue(
      learningMetrics.clarificationRequests,
      0,   // min clarifications
      15   // max expected clarifications
    );

    // Normalize assessment time per question (longer time = higher load)
    const assessmentTimeScore = this.normalizeValue(
      assessmentMetrics.averageTimePerQuestion,
      30,   // min expected time per question (30 seconds)
      300   // max expected time per question (5 minutes)
    );

    // Inverse of accuracy (lower accuracy = higher cognitive load)
    const accuracyScore = 100 - assessmentMetrics.accuracy;

    // Weighted average of all factors
    const overallScore = (
      learningTimeScore * 0.20 +      // 20% weight
      interactionScore * 0.15 +       // 15% weight
      clarificationScore * 0.20 +     // 20% weight
      assessmentTimeScore * 0.25 +    // 25% weight
      accuracyScore * 0.20            // 20% weight
    );

    return Math.min(100, Math.max(0, overallScore));
  }

  /**
   * Normalize a value to 0-100 scale
   */
  private normalizeValue(value: number, min: number, max: number): number {
    if (value <= min) return 0;
    if (value >= max) return 100;
    return ((value - min) / (max - min)) * 100;
  }

  /**
   * Categorize cognitive load level
   */
  private categorizeCognitiveLoad(score: number): 'Low' | 'Moderate' | 'High' | 'Very High' {
    if (score < 25) return 'Low';
    if (score < 50) return 'Moderate';
    if (score < 75) return 'High';
    return 'Very High';
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
