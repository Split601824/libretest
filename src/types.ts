export type QuestionType = 'mc' | 'essay';

export interface Question {
  id: number;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: number;
  points: number;
  rubric?: string;
}

export interface Exam {
  title: string;
  questions: Question[];
}