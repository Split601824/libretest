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
  const [examCode, setExamCode] = useState('');
  const [studentName, setStudentName] = useState('');

  const accentColor = '#15EB15';

  // No automatic fetch. User loads file manually.

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

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setExam(data);
        setAnswers(new Array(data.questions.length).fill(null));
        setLoading(false);
        setError(null);
      } catch (err) {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  if (error) return <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>Error: {error}</div>;
  if (!exam) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2>LibreTest Player</h2>
        <input
          type="file"
          accept=".json"
          onChange={handleFileLoad}
          style={{ marginBottom: '20px' }}
        />
        <div style={{ marginTop: '20px' }}>
          <label>Exam Code: </label>
          <input value={examCode} onChange={(e) => setExamCode(e.target.value)} />
        </div>
        <div>
          <label>Your Name: </label>
          <input value={studentName} onChange={(e) => setStudentName(e.target.value)} />
        </div>
        {examCode && studentName && (
          <button onClick={() => {
            // Here you'd fetch the exam from a server using the code
            // For now, just alert
            alert(`Code: ${examCode}\nName: ${studentName}\n(Server fetch not implemented yet)`);
          }}>Start Exam</button>
        )}
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!started) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
        <div style={{ padding: '20px 20px 0 20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'normal', fontFamily: 'Roboto, sans-serif', color: 'black' }}>
            {exam.title}
          </div>
          <div style={{ height: '4px', backgroundColor: accentColor, marginTop: '8px', width: '100%' }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <p>You will have {Math.floor(timeLeft / 60)} minutes to complete this exam.</p>
          <button onClick={() => setStarted(true)} style={{ fontFamily: 'Roboto, sans-serif', padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: accentColor, color: 'black', border: 'none', borderRadius: '4px' }}>
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    const score = answers.reduce((total, answer, idx) => {
      if (answer === exam.questions[idx].correctAnswer) {
        return total + exam.questions[idx].points;
      }
      return total;
    }, 0);
    const maxScore = exam.questions.reduce((total, q) => total + q.points, 0);
    return <Result score={score} maxScore={maxScore} />;
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
    <div style={{ fontFamily: 'Roboto, sans-serif', display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'white', color: 'black' }}>
      <div style={{ padding: '20px 20px 0 20px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '20px', top: '20px', fontSize: '16px', fontWeight: 'normal', fontFamily: 'Roboto, sans-serif', color: 'black' }}>
          {exam.title}
        </div>
        <div style={{ textAlign: 'center', fontSize: '17px', fontWeight: 'bold', fontFamily: 'Roboto, sans-serif', color: timeLeft <= 300 ? 'red' : 'black' }}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <div style={{ height: '4px', backgroundColor: accentColor, marginTop: '8px', width: '100%' }} />
      </div>

      <div style={{ flex: 1, padding: '20px' }}>
        <Question question={currentQuestion} selectedAnswer={selectedAnswer} onAnswerSelect={handleAnswerSelect} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center', padding: '20px', borderTop: `1px solid ${accentColor}`, backgroundColor: 'white' }}>
        <button onClick={handlePrevious} disabled={currentIndex === 0} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: currentIndex === 0 ? '#ccc' : 'black', border: 'none' }}>
          ←
        </button>
        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
          {currentIndex + 1} of {exam.questions.length}
        </span>
        <button onClick={handleNext} disabled={selectedAnswer === null} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', cursor: selectedAnswer === null ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: selectedAnswer === null ? '#ccc' : 'black', border: 'none' }}>
          →
        </button>
      </div>
    </div>
  );
}

export default App;