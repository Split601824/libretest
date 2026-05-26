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
  const [warningThreshold] = useState(300); // 5 minutes

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
          handleSubmit();
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
      handleSubmit();
    }
  }, [timeLeft, submitted]);

  const calculateScore = () => {
    let earnedPoints = 0;
    let totalPoints = 0;

    for (let i = 0; i < exam.questions.length; i++) {
      const q = exam.questions[i];
      totalPoints += q.points;
      const answer = answers[i];

      if (q.type === 'mc' && answer === q.correctAnswer) {
        earnedPoints += q.points;
      } else if (q.type === 'essay' && typeof answer === 'number') {
        earnedPoints += answer;
      }
    }

    return { earnedPoints, totalPoints };
  };

  const saveResult = () => {
    const { earnedPoints, totalPoints } = calculateScore();
    const pastExams = JSON.parse(localStorage.getItem('pastExams') || '[]');
    pastExams.push({
      id: Date.now().toString(),
      title: exam.title,
      subject: exam.title,
      score: earnedPoints,
      maxScore: totalPoints,
      date: new Date().toISOString(),
      status: 'unmarked'
    });
    localStorage.setItem('pastExams', JSON.stringify(pastExams));
  };

  const handleSubmit = () => {
    saveResult();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ 
        fontFamily: 'Roboto, sans-serif', 
        backgroundColor: 'white', 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '500px', width: '100%' }}>
          <h1 style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold', marginBottom: '16px', color: '#000' }}>Submitted</h1>
          <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '24px', color: '#000' }}>
            This exam is complete.<br />
            Your device has been unlocked and you may exit.
          </p>
          
          <h3 style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold', marginBottom: '8px', color: '#000' }}>Reminders:</h3>
          <ul style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '32px', paddingLeft: '20px', color: '#000' }}>
            <li>Do not distract candidates still testing.</li>
            <li>Maintain integrity of the test at all times.</li>
            <li>You may not return to this exam.</li>
            <li>Your results will be calculated shortly.</li>
          </ul>
          
          <button 
            onClick={onComplete} 
            style={{ 
              fontFamily: 'Roboto, sans-serif',
              padding: '10px 20px', 
              backgroundColor: '#00b000', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontWeight: 'bold' 
            }}
          >
            Exit
          </button>
        </div>
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
      handleSubmit();
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
            {minutes}:{seconds.toString().padStart(2, '0')}
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