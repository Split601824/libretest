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

  const accentColor = '#15EB15';

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

  if (loading) return <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>Loading exam...</div>;
  if (error) return <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>Error: {error}</div>;
  if (!exam) return <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>No exam loaded</div>;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Start screen
  if (!started) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
        <div style={{ padding: '20px' }}>
          <h1 style={{ margin: 0, color: 'black', fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 'normal' }}>{exam.title}</h1>
          <div style={{ height: '4px', backgroundColor: accentColor, marginTop: '8px', width: '100%' }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <p style={{ color: 'black' }}>You will have {Math.floor(timeLeft / 60)} minutes to complete this exam.</p>
          <button 
            onClick={() => setStarted(true)} 
            style={{ 
              fontFamily: 'Roboto, sans-serif', 
              padding: '10px 20px', 
              fontSize: '16px', 
              cursor: 'pointer',
              backgroundColor: accentColor,
              color: 'black',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Start Exam
          </button>
        </div>
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

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div style={{ 
      fontFamily: 'Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'white',
      color: 'black'
    }}>
      {/* Header: Title top left, Timer top center, Green bar below */}
      <div style={{ padding: '20px 20px 0 20px', position: 'relative' }}>
  <div style={{ 
    position: 'absolute', 
    left: '20px', 
    top: '20px',
    fontSize: '16px', 
    fontWeight: 'normal', 
    fontFamily: 'Roboto, sans-serif',
    color: 'black'
  }}>
    {exam.title}
  </div>
  <div style={{ 
    textAlign: 'center',
    fontSize: '17px', 
    fontWeight: 'bold', 
    fontFamily: 'Roboto, sans-serif',
    color: timeLeft <= 300 ? 'red' : 'black'
  }}>
    {minutes}:{seconds.toString().padStart(2, '0')}
  </div>
  <div style={{ height: '4px', backgroundColor: accentColor, marginTop: '8px', width: '100%' }} />
</div>

      {/* Main content area */}
      <div style={{ flex: 1, padding: '20px' }}>
        <Question
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={handleAnswerSelect}
        />
      </div>

      {/* Navigation: Previous and Next at bottom */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '20px',
        borderTop: `1px solid ${accentColor}`,
        backgroundColor: 'white'
      }}>
        <button 
          onClick={handlePrevious} 
          disabled={currentIndex === 0}
          style={{ 
            fontFamily: 'Roboto, sans-serif',
            fontSize: '16px',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            backgroundColor: 'transparent',
            color: currentIndex === 0 ? '#ccc' : 'black',
            border: 'none'
          }}
        >
          ← Previous
        </button>
        <button 
          onClick={handleNext} 
          disabled={selectedAnswer === null}
          style={{ 
            fontFamily: 'Roboto, sans-serif',
            fontSize: '16px',
            cursor: selectedAnswer === null ? 'not-allowed' : 'pointer',
            backgroundColor: 'transparent',
            color: selectedAnswer === null ? '#ccc' : 'black',
            border: 'none'
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default App;