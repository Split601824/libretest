import { useState, useEffect } from 'react';
import { Question } from './Question';
import { Result } from './Result';
import type { Exam } from './types';

function App() {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(360);
  const [timerActive, setTimerActive] = useState(true);

  // Load exam from JSON file
  useEffect(() => {
    fetch('/exam.json?t=' + Date.now())
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load exam');
        return res.json();
      })
      .then((data: Exam) => {
        setExam(data);
        setAnswers(new Array(data.questions.length).fill(null));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Timer logic
  useEffect(() => {
    if (!started || !timerActive) return;
    if (timeLeft <= 0) {
      setSubmitted(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [started, timerActive, timeLeft]);

  if (loading) return <div style={{ fontFamily: 'Roboto, sans-serif' }}>Loading exam...</div>;
  if (error) return <div style={{ fontFamily: 'Roboto, sans-serif' }}>Error: {error}</div>;
  if (!exam) return <div style={{ fontFamily: 'Roboto, sans-serif' }}>No exam loaded</div>;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Start screen
  if (!started) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '50px' }}>
        <h1>{exam.title}</h1>
        <p>You will have {Math.floor(timeLeft / 60)} minutes to complete this exam.</p>
        <button 
          onClick={() => setStarted(true)} 
          style={{ 
            fontFamily: 'Roboto, sans-serif', 
            padding: '10px 20px', 
            fontSize: '16px', 
            cursor: 'pointer',
            backgroundColor: '#2E7D32',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Start Exam
        </button>
      </div>
    );
  }

  // Submitted screen
  if (submitted) {
    const score = answers.reduce((total, answer, idx) => {
      return total + (answer === exam.questions[idx].correctAnswer ? 1 : 0);
    }, 0);
    return <Result score={score} total={exam.questions.length} />;
  }

  // Active test screen
  const currentQuestion = exam.questions[currentIndex];
  const selectedAnswer = answers[currentIndex];

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < exam.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px', 
        fontWeight: 'bold', 
        color: timeLeft <= 300 ? 'red' : 'black'
      }}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
      <h1 style={{ fontFamily: 'Roboto, sans-serif' }}>{exam.title}</h1>
      <Question
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        onAnswerSelect={handleAnswerSelect}
      />
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '10px', 
        marginTop: '20px' 
      }}>
        <button 
          onClick={() => setCurrentIndex(currentIndex - 1)} 
          disabled={currentIndex === 0}
          style={{ 
            fontFamily: 'Roboto, sans-serif',
            padding: '8px 16px',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            backgroundColor: currentIndex === 0 ? '#ccc' : '#2E7D32',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Previous
        </button>
        <button 
          onClick={handleNext} 
          disabled={selectedAnswer === null}
          style={{ 
            fontFamily: 'Roboto, sans-serif',
            padding: '8px 16px',
            cursor: selectedAnswer === null ? 'not-allowed' : 'pointer',
            backgroundColor: selectedAnswer === null ? '#ccc' : '#2E7D32',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {currentIndex < exam.questions.length - 1 ? 'Next' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

export default App;