import { useState } from 'react';
import { PlayerHome } from './PlayerHome';
import { ExamPlayer } from './ExamPlayer'; // We'll create this
import type { Exam } from './types';

function AppPlayer() {
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [examStarted, setExamStarted] = useState(false);

  const handleStartExam = (examId: string, examData?: Exam) => {
    if (examData) {
      setCurrentExam(examData);
      setExamStarted(true);
    } else {
      // For sample exams, we'd load from server
      console.log('Start exam:', examId);
      // TODO: Load exam from server by ID
    }
  };

  const handleImportJSON = (jsonData: Exam) => {
    setCurrentExam(jsonData);
    setExamStarted(true);
  };

  const handleDigitizePDF = (file: File) => {
    console.log('Digitize PDF:', file.name);
    // TODO: Send to backend for OCR processing
    alert(`PDF digitization not yet implemented. Received: ${file.name}`);
  };

  const handleRegistryCode = (code: string) => {
    console.log('Registry code:', code);
    // TODO: Fetch exam from server by code
    alert(`Exam code ${code} submitted. Server fetch not yet implemented.`);
  };

  const handleExamComplete = () => {
    setExamStarted(false);
    setCurrentExam(null);
  };

  if (examStarted && currentExam) {
    return <ExamPlayer exam={currentExam} onComplete={handleExamComplete} />;
  }

  return (
    <PlayerHome 
      onStartExam={handleStartExam}
      onImportJSON={handleImportJSON}
      onDigitizePDF={handleDigitizePDF}
      onRegistryCode={handleRegistryCode}
    />
  );
}

export default AppPlayer;