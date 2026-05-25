import { useState } from 'react';
import { QuestionEditor } from './QuestionEditor';
import type { Question, Exam } from './types';

function AppStudio() {
  const [title, setTitle] = useState('New Exam');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);

  const accentColor = '#15EB15';

  const addQuestion = () => {
    const newQuestion: Question = {
      id: nextId,
      type: 'mc',
      text: 'New question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      points: 1,
    };
    setQuestions([...questions, newQuestion]);
    setNextId(nextId + 1);
    setEditingIndex(questions.length);
  };

  const saveQuestion = (updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[editingIndex!] = updatedQuestion;
    setQuestions(newQuestions);
    setEditingIndex(null);
  };

  const deleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    
    // Handle editing index after deletion
    if (editingIndex !== null) {
      if (editingIndex === index) {
        setEditingIndex(null);
      } else if (editingIndex > index) {
        setEditingIndex(editingIndex - 1);
      }
    }
  };

  const saveToFile = () => {
    const exam: Exam = { title, questions };
    const blob = new Blob([JSON.stringify(exam, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setTitle(data.title);
        setQuestions(data.questions);
        const maxId = Math.max(...data.questions.map((q: Question) => q.id), 0);
        setNextId(maxId + 1);
        setEditingIndex(null);
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
      <div style={{ padding: '20px 20px 0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h1 style={{ margin: 0, color: 'black', fontFamily: 'Roboto, sans-serif', fontSize: '24px', fontWeight: 'normal' }}>
            LibreTest Studio
          </h1>
        </div>
        <div style={{ height: '4px', backgroundColor: accentColor, marginTop: '8px', width: '100%' }} />
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold' }}>Exam Title:</label>
          <br />
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginTop: '4px',
              fontFamily: 'Roboto, sans-serif',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ 
            fontFamily: 'Roboto, sans-serif',
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Load JSON
            <input
              type="file"
              accept=".json"
              onChange={loadFromFile}
              style={{ display: 'none' }}
            />
          </label>
          <button 
            onClick={saveToFile}
            style={{ 
              fontFamily: 'Roboto, sans-serif',
              padding: '8px 16px',
              backgroundColor: accentColor,
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save to JSON
          </button>
        </div>

        <h3>Questions ({questions.length})</h3>

        {questions.length === 0 && (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No questions yet. Click "Add Question" to start.</p>
        )}

        {questions.map((q, idx) => (
          <div key={q.id} style={{ 
            border: '1px solid #ddd', 
            padding: '12px', 
            marginBottom: '8px', 
            borderRadius: '4px',
            backgroundColor: editingIndex === idx ? '#f9f9f9' : 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong>{idx + 1}. {q.text.length > 60 ? q.text.substring(0, 60) + '...' : q.text}</strong>
                <span style={{ marginLeft: '8px', color: '#666', fontSize: '12px' }}>
                  ({q.type === 'mc' ? 'Multiple Choice' : 'Essay'}, {q.points} pts)
                </span>
              </div>
              <div>
                <button 
                  onClick={() => setEditingIndex(idx)} 
                  style={{ 
                    fontFamily: 'Roboto, sans-serif',
                    padding: '4px 12px',
                    marginRight: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => deleteQuestion(idx)}
                  style={{ 
                    fontFamily: 'Roboto, sans-serif',
                    padding: '4px 12px',
                    cursor: 'pointer',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={addQuestion}
          style={{ 
            margin: '20px 0',
            padding: '10px 20px',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: accentColor,
            color: 'black',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          + Add Question
        </button>

        {editingIndex !== null && (
          <div style={{ marginTop: '20px', borderTop: `2px solid ${accentColor}`, paddingTop: '20px' }}>
            <h3>Editing Question {editingIndex + 1}</h3>
            <QuestionEditor
              question={questions[editingIndex]}
              onSave={saveQuestion}
              onCancel={() => setEditingIndex(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default AppStudio;