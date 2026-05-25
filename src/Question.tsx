import type { Question as QuestionType } from './types';

interface QuestionProps {
  question: QuestionType;
  selectedAnswer: number | null;
  onAnswerSelect: (answerIndex: number) => void;
}

const fontStyle = {
  fontFamily: 'Roboto, sans-serif'
};

export function Question({ question, selectedAnswer, onAnswerSelect }: QuestionProps) {
  return (
    <div style={fontStyle}>
      <h2 style={fontStyle}>{question.text}</h2>
      {question.options.map((option: string, idx: number) => (
        <div key={idx} style={{ marginBottom: '8px' }}>
          <input
            type="radio"
            name="question"
            checked={selectedAnswer === idx}
            onChange={() => onAnswerSelect(idx)}
            style={{ marginRight: '8px' }}
          />
          <label style={fontStyle}>{option}</label>
        </div>
      ))}
    </div>
  );
}