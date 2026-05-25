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
  // Check if this is a True/False question
  const isTrueFalse = question.options.length === 2 && 
                      question.options[0] === 'True' && 
                      question.options[1] === 'False';

  return (
    <div style={fontStyle}>
      <h2 style={fontStyle}>{question.text}</h2>
      {question.options.map((option: string, idx: number) => {
        let label;
        if (isTrueFalse) {
          // For True/False, use the actual words
          label = option;
        } else {
          // For regular MC, use A, B, C, D, etc.
          label = `${String.fromCharCode(65 + idx)}.`;
        }
        return (
          <div key={idx} style={{ marginBottom: '8px' }}>
            <input
              type="radio"
              name="question"
              checked={selectedAnswer === idx}
              onChange={() => onAnswerSelect(idx)}
              style={{ marginRight: '8px' }}
            />
            <label style={fontStyle}>{label} {option}</label>
          </div>
        );
      })}
    </div>
  );
}