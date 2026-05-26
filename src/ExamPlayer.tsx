import { useState, useEffect } from 'react';
import type { Exam } from './types';

interface ExamPlayerProps {
  exam: Exam;
  onComplete: () => void;
}

export function ExamPlayer({ exam, onComplete }: ExamPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | string)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // Default 60 minutes

  useEffect(() => {
    setAnswers(new Array(exam.questions.length).fill(null));
  }, [exam]);

  // Timer
  useEffect(() => {
    if (submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft <= 0 && !submitted) {
      setSubmitted(true);
    }
  }, [timeLeft, submitted]);

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Submitted</h1>
        <p>This exam is complete. You may exit now.</p>
        <button onClick={onComplete}>Exit</button>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentIndex];
  const selectedAnswer = answers[currentIndex];

  const handleAnswerSelect = (answer: number | string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>Time: {minutes}:{seconds.toString().padStart(2, '0')}</div>
        <div>Question {currentIndex + 1} of {exam.questions.length}</div>
      </div>

      <h2>{currentQuestion.text}</h2>

      {currentQuestion.type === 'mc' && currentQuestion.options && (
        <div>
          {currentQuestion.options.map((opt, idx) => (
            <div key={idx} style={{ marginBottom: '8px' }}>
              <label>
                <input
                  type="radio"
                  name="question"
                  checked={selectedAnswer === idx}
                  onChange={() => handleAnswerSelect(idx)}
                  style={{ marginRight: '8px' }}
                />
                {String.fromCharCode(65 + idx)}. {opt}
              </label>
            </div>
          ))}
        </div>
      )}

      {currentQuestion.type === 'essay' && (
        <textarea
          rows={8}
          style={{ width: '100%', padding: '8px' }}
          value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
          onChange={(e) => handleAnswerSelect(e.target.value)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button onClick={handlePrevious} disabled={currentIndex === 0}>Previous</button>
        <button onClick={handleNext} disabled={selectedAnswer === null && currentQuestion.type !== 'essay'}>
          {currentIndex < exam.questions.length - 1 ? 'Next' : 'Submit'}
        </button>
      </div>
    </div>
  );
}