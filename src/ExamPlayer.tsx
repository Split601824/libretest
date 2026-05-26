import React, { useState, useEffect } from 'react';
import type { Exam } from './types';

interface ExamPlayerProps {
  exam: Exam;
  onComplete: () => void;
}

export function ExamPlayer({ exam, onComplete }: ExamPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | string)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [warningThreshold, setWarningThreshold] = useState(300); // 5 minutes

  useEffect(() => {
    setAnswers(new Array(exam.questions.length).fill(null));
    // TODO: Read time limit from exam config
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
      <div style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '50px' }}>
        <h1>Submitted</h1>
        <p>This exam is complete. You may exit now.</p>
        <button onClick={onComplete} style={{ padding: '10px 20px', backgroundColor: '#00b000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Exit</button>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft <= warningThreshold;

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

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
      {/* Top bar with timer and progress */}
      <div style={{ backgroundColor: '#00b000', padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '20px', color: 'white' }}>
            <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
          </div>
          <div style={{ fontSize: isWarning ? '20px' : '18px', fontWeight: 'bold', color: isWarning ? '#ffcccc' : 'white' }}>
            Time: {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <div style={{ fontSize: '14px', color: 'white' }}>
            Question {currentIndex + 1} of {exam.questions.length}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'Roboto', fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', lineHeight: '1.4', color: '#000' }}>{currentQuestion.text}</h2>

          {/* Multiple Choice */}
          {currentQuestion.type === 'mc' && currentQuestion.options && (
            <div>
              {currentQuestion.options.map((opt, idx) => (
                <div key={idx} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="question"
                    id={`opt_${idx}`}
                    checked={selectedAnswer === idx}
                    onChange={() => handleAnswerSelect(idx)}
                    style={{ marginRight: '12px', width: '18px', height: '18px', accentColor: '#00b000', cursor: 'pointer' }}
                  />
                  <label htmlFor={`opt_${idx}`} style={{ fontSize: '16px', cursor: 'pointer' }}>
                    <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Essay */}
          {currentQuestion.type === 'essay' && (
            <textarea
              rows={8}
              style={{ width: '100%', padding: '12px', fontSize: '14px', fontFamily: 'Roboto, sans-serif', border: '1px solid #ccc', borderRadius: '4px' }}
              value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
              onChange={(e) => handleAnswerSelect(e.target.value)}
              placeholder="Type your answer here..."
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: currentIndex === 0 ? '#ccc' : '#00b000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={selectedAnswer === null && currentQuestion.type !== 'essay'}
            style={{
              padding: '10px 20px',
              backgroundColor: (selectedAnswer === null && currentQuestion.type !== 'essay') ? '#ccc' : '#00b000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (selectedAnswer === null && currentQuestion.type !== 'essay') ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {currentIndex < exam.questions.length - 1 ? 'Next →' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}