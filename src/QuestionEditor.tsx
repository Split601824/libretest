import { useState, useEffect } from 'react';
import type { Question, QuestionType } from './types';

interface QuestionEditorProps {
  question: Question;
  onSave: (updatedQuestion: Question) => void;
  onCancel: () => void;
}

export function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [type, setType] = useState<QuestionType>(question.type);
  const [text, setText] = useState(question.text);
  const [points, setPoints] = useState(question.points);
  const [options, setOptions] = useState<string[]>(question.options || ['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState<number>(question.correctAnswer || 0);
  const [rubric, setRubric] = useState(question.rubric || '');

  // Sync when question changes
  useEffect(() => {
    setType(question.type);
    setText(question.text);
    setPoints(question.points);
    if (question.type === 'mc' && question.options) {
      setOptions(question.options);
      setCorrectAnswer(question.correctAnswer || 0);
    } else {
      setRubric(question.rubric || '');
    }
  }, [question]);

  const handleSave = () => {
    const updated: Question = {
      id: question.id,
      type,
      text,
      points,
    };
    
    if (type === 'mc') {
      updated.options = options;
      updated.correctAnswer = correctAnswer;
    } else {
      updated.rubric = rubric;
    }
    
    onSave(updated);
  };

  const addOption = () => {
    setOptions([...options, `Option ${String.fromCharCode(65 + options.length)}`]);
  };

  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    // Adjust correctAnswer if needed
    if (correctAnswer >= newOptions.length) {
      setCorrectAnswer(Math.max(0, newOptions.length - 1));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', marginBottom: '16px', borderRadius: '4px' }}>
      <div style={{ marginBottom: '12px' }}>
        <label>Question Type: </label>
        <select value={type} onChange={(e) => setType(e.target.value as QuestionType)}>
          <option value="mc">Multiple Choice</option>
          <option value="essay">Essay</option>
        </select>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label>Question Text: </label><br />
        <textarea 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          rows={3}
          style={{ width: '100%', fontFamily: 'Roboto, sans-serif', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label>Points: </label>
        <input 
          type="number" 
          value={points} 
          onChange={(e) => setPoints(Number(e.target.value))}
          style={{ width: '80px', padding: '4px' }}
        />
      </div>
      
      {type === 'mc' && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label>Options:</label><br />
            {options.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ width: '30px', fontWeight: 'bold' }}>{String.fromCharCode(65 + idx)}.</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  style={{ flex: 1, padding: '6px', fontFamily: 'Roboto, sans-serif' }}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                />
                <button
                  onClick={() => removeOption(idx)}
                  style={{ 
                    padding: '4px 8px', 
                    cursor: 'pointer', 
                    backgroundColor: '#ff4444', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button
              onClick={addOption}
              style={{ 
                marginTop: '8px', 
                padding: '4px 12px', 
                cursor: 'pointer',
                backgroundColor: '#15EB15',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              + Add Option
            </button>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label>Correct Answer: </label>
            <select value={correctAnswer} onChange={(e) => setCorrectAnswer(Number(e.target.value))}>
              {options.map((opt, idx) => (
                <option key={idx} value={idx}>
                  {String.fromCharCode(65 + idx)}. {opt || `Option ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      
      {type === 'essay' && (
        <div style={{ marginBottom: '12px' }}>
          <label>Rubric (optional):</label><br />
          <textarea 
            value={rubric} 
            onChange={(e) => setRubric(e.target.value)}
            rows={3}
            style={{ width: '100%', fontFamily: 'Roboto, sans-serif', padding: '8px' }}
            placeholder="Grading criteria for this essay question"
          />
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button onClick={onCancel} style={{ padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSave} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#15EB15', border: 'none', borderRadius: '4px' }}>Save</button>
      </div>
    </div>
  );
}