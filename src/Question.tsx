import type { Question as QuestionType } from './types';

interface QuestionProps {
  question: QuestionType;
  selectedAnswer: number | string | null;
  onAnswerSelect: (answerIndex: number | string) => void;
}

const fontStyle = {
  fontFamily: 'Roboto, sans-serif',
  color: 'black'
};

export function Question({ question, selectedAnswer, onAnswerSelect }: QuestionProps) {
  // Multiple Choice
  if (question.type === 'mc' && question.options) {
    const isTrueFalse = question.options.length === 2 && 
                        question.options[0] === 'True' && 
                        question.options[1] === 'False';

    return (
      <div style={fontStyle}>
        <h2 style={fontStyle}>{question.text}</h2>
        {question.options.map((option: string, idx: number) => {
          let label;
          if (isTrueFalse) {
            label = option;
          } else {
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

  // Essay
  if (question.type === 'essay') {
    return (
      <div style={fontStyle}>
        <h2 style={fontStyle}>{question.text}</h2>
        <textarea
          rows={8}
          style={{ 
            width: '100%', 
            fontFamily: 'Roboto, sans-serif', 
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
          onChange={(e) => onAnswerSelect(e.target.value)}
        />
        {question.rubric && (
          <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
            Rubric: {question.rubric}
          </div>
        )}
      </div>
    );
  }

  return <div>Unknown question type</div>;
}