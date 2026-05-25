export type QuestionType = 'mc' | 'essay';

export interface Question {
  id: number;
  type: QuestionType;
  text: string;
  options?: string[];      // only for mc
  correctAnswer?: number;   // only for mc
  points: number;
  rubric?: string;          // only for essay
}

export interface Exam {
  title: string;
  questions: Question[];
}