import { AssessmentQuestion } from '../types';
import { getAssessmentQuestions } from '../data/questionsData';

/**
 * Generates assessment questions based on topic, reading content, and user notes
 */
export async function generateAssessmentQuestions(
  topic: string,
  readingContent: string,
  notes: string
): Promise<AssessmentQuestion[]> {
  
  // First, try to get predefined questions for the topic
  const predefinedQuestions = getAssessmentQuestions(topic);
  
  if (predefinedQuestions && predefinedQuestions.length > 0) {
    // If predefined questions exist, return them
    console.log(`Using ${predefinedQuestions.length} predefined questions for topic: ${topic}`);
    return predefinedQuestions;
  }
  
  // If no predefined questions, generate custom questions based on notes
  console.log(`Generating custom questions for topic: ${topic}`);
  return generateCustomQuestions(topic, readingContent, notes);
}

/**
 * Generates custom questions when predefined ones don't exist
 */
function generateCustomQuestions(
  topic: string,
  readingContent: string, // Reserved for future AI-based question generation
  notes: string
): AssessmentQuestion[] {
  
  // Extract key concepts from notes (simple keyword extraction)
  const keyConcepts = extractKeyConcepts(notes);
  
  // TODO: In future, use readingContent to generate more context-aware questions
  
  const questions: AssessmentQuestion[] = [];
  
  // Generate understanding questions
  if (keyConcepts.length > 0) {
    questions.push({
      id: `gen-1-${Date.now()}`,
      question: `Based on your reading, what is the main concept of ${topic}?`,
      type: 'multiple-choice',
      options: generateOptions(keyConcepts, 'concept'),
      correctAnswer: generateOptions(keyConcepts, 'concept')[0],
      difficulty: 'easy',
      expectedTimeSeconds: 60,
      topic,
      points: 10
    });
  }
  
  // Generate application question
  questions.push({
    id: `gen-2-${Date.now()}`,
    question: `How can the principles of ${topic} be applied in real-world scenarios?`,
    type: 'multiple-choice',
    options: [
      'By implementing systematic approaches based on core principles',
      'By ignoring fundamental concepts',
      'By applying unrelated methodologies',
      'By avoiding practical implementation'
    ],
    correctAnswer: 'By implementing systematic approaches based on core principles',
    difficulty: 'medium',
    expectedTimeSeconds: 90,
    topic,
    points: 15
  });
  
  // Generate analysis question
  questions.push({
    id: `gen-3-${Date.now()}`,
    question: `What are the key benefits and challenges of ${topic}?`,
    type: 'multiple-choice',
    options: [
      'Benefits include improved outcomes, but challenges exist in implementation',
      'Only benefits exist with no challenges',
      'Only challenges exist with no benefits',
      'Neither benefits nor challenges are relevant'
    ],
    correctAnswer: 'Benefits include improved outcomes, but challenges exist in implementation',
    difficulty: 'medium',
    expectedTimeSeconds: 90,
    topic,
    points: 15
  });
  
  // Generate evaluation question
  questions.push({
    id: `gen-4-${Date.now()}`,
    question: `Based on your understanding, what factors determine the success of ${topic}?`,
    type: 'multiple-choice',
    options: [
      'Proper planning, execution, and continuous evaluation',
      'Random chance alone',
      'Avoiding all systematic approaches',
      'Ignoring established principles'
    ],
    correctAnswer: 'Proper planning, execution, and continuous evaluation',
    difficulty: 'hard',
    expectedTimeSeconds: 120,
    topic,
    points: 20
  });
  
  // Generate synthesis question based on notes
  if (notes.length > 50) {
    questions.push({
      id: `gen-5-${Date.now()}`,
      question: `How does ${topic} integrate with other related concepts you've learned?`,
      type: 'multiple-choice',
      options: [
        'It connects through shared principles and complementary approaches',
        'It operates in complete isolation',
        'It contradicts all other concepts',
        'It has no relationship with other ideas'
      ],
      correctAnswer: 'It connects through shared principles and complementary approaches',
      difficulty: 'hard',
      expectedTimeSeconds: 120,
      topic,
      points: 20
    });
  }
  
  return questions;
}

/**
 * Extracts key concepts from user notes
 */
function extractKeyConcepts(notes: string): string[] {
  if (!notes || notes.trim().length === 0) {
    return [];
  }
  
  // Simple extraction: split by sentences and take key phrases
  const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const concepts: string[] = [];
  
  sentences.forEach(sentence => {
    // Extract words longer than 5 characters as potential key concepts
    const words = sentence.match(/\b\w{5,}\b/g) || [];
    concepts.push(...words.slice(0, 2)); // Take up to 2 concepts per sentence
  });
  
  // Return unique concepts, limited to 10
  return [...new Set(concepts)].slice(0, 10);
}

/**
 * Generates plausible options for questions
 */
function generateOptions(keyConcepts: string[], type: string): string[] {
  const options: string[] = [];
  
  if (type === 'concept' && keyConcepts.length > 0) {
    // Use actual key concepts as correct answer and distractors
    options.push(keyConcepts[0]); // Correct answer
    options.push(`Alternative interpretation of ${keyConcepts[1] || 'the concept'}`);
    options.push('Unrelated principle');
    options.push('Opposite approach');
  } else {
    // Default options
    options.push('Core principle A', 'Core principle B', 'Core principle C', 'Core principle D');
  }
  
  return options;
}
