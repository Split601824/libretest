import React, { useState, useEffect, useMemo } from 'react';

interface WrittenResponseLimits {
  mode: 'characters' | 'words' | 'both';
  min?: number;
  max?: number;
}

interface Question {
  id: string;
  type: 'MCQ' | 'WRITTEN';
  text: string;
  points: number;
  tags: string[];
  correctOptions?: string[];
  incorrectOptions?: string[];
  limits?: WrittenResponseLimits;
  fixedOptionIndex?: number;
  fixedOptionText?: string;
}

// Legacy format (v0.3.2)
interface LegacyQuestion {
  id: string;
  type: 'mc' | 'essay';
  text: string;
  options?: string[];
  correctAnswer?: number;
  points: number;
}

interface LegacyExam {
  title: string;
  questions: LegacyQuestion[];
}

interface ExamQuestion {
  id: string;
  sourceType: 'bank' | 'standalone' | 'blank';
  sourceId?: string;
  question: Question;
  overridePoints?: number;
}

interface GroupNode {
  id: string;
  name: string;
  type: 'section' | 'module' | 'submodule';
  groups: GroupNode[];
  questions: ExamQuestion[];
}

interface ExamCondition {
  securityLevel: 'Open' | 'Protected' | 'Secure' | 'Very Secure' | 'Lockdown';
  timeLimit?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  passingScore?: number;
  questionOrderMode: 'manual' | 'auto';
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  conditions: ExamCondition;
  sections: GroupNode[];
  createdAt: number;
  updatedAt: number;
}

interface ExamPlayerProps {
  exam: Exam | LegacyExam;
  onComplete: () => void;
}

interface FlattenedQuestion {
  id: string;
  text: string;
  type: 'MCQ' | 'WRITTEN';
  points: number;
  originalQuestion: Question | LegacyQuestion;
  sectionPath: string;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const shuffleOptionsWithFixed = (
  correctOptions: string[],
  incorrectOptions: string[],
  fixedOptionIndex?: number,
  fixedOptionText?: string
): { options: string[]; fixedLetter?: string; fixedOption: string | null } => {
  let allOptions = [...correctOptions, ...incorrectOptions];
  
  let fixedOption: string | null = null;
  let fixedLetter: string | undefined;
  
  if (fixedOptionIndex !== undefined && fixedOptionText && fixedOptionIndex >= 0 && fixedOptionIndex < 4) {
    fixedOption = fixedOptionText;
    allOptions = allOptions.filter(opt => opt !== fixedOption);
  }
  
  const shuffledOptions = shuffleArray(allOptions);
  
  if (fixedOption && fixedOptionIndex !== undefined) {
    shuffledOptions.splice(fixedOptionIndex, 0, fixedOption);
    fixedLetter = String.fromCharCode(65 + fixedOptionIndex);
  }
  
  return { options: shuffledOptions, fixedLetter, fixedOption };
};

export function ExamPlayer({ exam, onComplete }: ExamPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | string)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [warningThreshold] = useState(300);
  const [error, setError] = useState<string | null>(null);

  // Detect exam format and flatten questions
  const flattenedQuestions = useMemo(() => {
    // Check if it's legacy format (has 'questions' array directly)
    const isLegacy = (exam as any).questions && !(exam as Exam).sections;
    
    if (isLegacy) {
      const legacyExam = exam as LegacyExam;
      return legacyExam.questions.map((q, idx) => ({
        id: q.id || `q${idx}`,
        text: q.text,
        type: q.type === 'mc' ? 'MCQ' as const : 'WRITTEN' as const,
        points: q.points || 1,
        originalQuestion: q,
        sectionPath: ''
      }));
    }
    
    // New format with sections/groups
    const examWithSections = exam as Exam;
    if (!examWithSections.sections || examWithSections.sections.length === 0) {
      setError('This exam has no questions. Please add questions to the exam first.');
      return [];
    }
    
    const flatten = (groups: GroupNode[], path: string = ''): FlattenedQuestion[] => {
      let result: FlattenedQuestion[] = [];
      for (const group of groups) {
        const currentPath = path ? `${path} > ${group.name}` : group.name;
        for (const eq of group.questions) {
          if (eq.question) {
            result.push({
              id: eq.id,
              text: eq.question.text,
              type: eq.question.type,
              points: eq.overridePoints || eq.question.points || 1,
              originalQuestion: eq.question,
              sectionPath: currentPath
            });
          }
        }
        if (group.groups && group.groups.length > 0) {
          result = result.concat(flatten(group.groups, currentPath));
        }
      }
      return result;
    };
    
    let allQuestions = flatten(examWithSections.sections);
    
    if (examWithSections.conditions?.questionOrderMode === 'auto') {
      allQuestions = shuffleArray(allQuestions);
    }
    
    if (allQuestions.length === 0) {
      setError('This exam has no questions. Please add questions to the exam first.');
    }
    
    return allQuestions;
  }, [exam]);

  // Pre-shuffle options for MCQ questions
  const [shuffledOptions, setShuffledOptions] = useState<Map<string, { options: string[]; fixedLetter?: string; fixedOption: string | null }>>(new Map());

  useEffect(() => {
    if (flattenedQuestions.length === 0) return;
    
    const optionsMap = new Map();
    for (const q of flattenedQuestions) {
      if (q.type === 'MCQ') {
        const originalQ = q.originalQuestion as Question;
        if (originalQ.correctOptions && originalQ.correctOptions.length > 0 && originalQ.incorrectOptions) {
          const shuffled = shuffleOptionsWithFixed(
            originalQ.correctOptions,
            originalQ.incorrectOptions,
            originalQ.fixedOptionIndex,
            originalQ.fixedOptionText
          );
          optionsMap.set(q.id, shuffled);
        } else if ((q.originalQuestion as LegacyQuestion).options) {
          // Legacy MCQ format
          const legacyQ = q.originalQuestion as LegacyQuestion;
          const allOptions = legacyQ.options || [];
          const correctAnswerIndex = legacyQ.correctAnswer;
          const correctOption = correctAnswerIndex !== undefined ? allOptions[correctAnswerIndex] : null;
          const incorrectOptions = allOptions.filter((_, idx) => idx !== correctAnswerIndex);
          const shuffled = shuffleOptionsWithFixed(
            correctOption ? [correctOption] : [],
            incorrectOptions,
            undefined,
            undefined
          );
          optionsMap.set(q.id, shuffled);
        }
      }
    }
    setShuffledOptions(optionsMap);
    setAnswers(new Array(flattenedQuestions.length).fill(null));
  }, [flattenedQuestions]);

  // Set time limit from exam conditions
  useEffect(() => {
    const examWithConditions = exam as Exam;
    if (examWithConditions.conditions?.timeLimit) {
      const { days = 0, hours = 0, minutes = 0, seconds = 0 } = examWithConditions.conditions.timeLimit;
      const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
      if (totalSeconds > 0) {
        setTimeLeft(totalSeconds);
      }
    }
  }, [exam]);

  // Timer
  useEffect(() => {
    if (!examStarted || submitted) return;

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
  }, [examStarted, submitted]);

  useEffect(() => {
    if (timeLeft <= 0 && !submitted && examStarted) {
      handleSubmit();
    }
  }, [timeLeft, submitted, examStarted]);

  const calculateScore = () => {
    let earnedPoints = 0;
    let totalPoints = 0;

    for (let i = 0; i < flattenedQuestions.length; i++) {
      const q = flattenedQuestions[i];
      totalPoints += q.points;
      const answer = answers[i];

      if (q.type === 'MCQ') {
        const originalQ = q.originalQuestion as Question;
        const legacyQ = q.originalQuestion as LegacyQuestion;
        
        if (originalQ.correctOptions) {
          const selectedOptionText = answer as string;
          if (originalQ.correctOptions.includes(selectedOptionText)) {
            earnedPoints += q.points;
          }
        } else if (legacyQ.correctAnswer !== undefined) {
          const selectedIndex = answer as number;
          if (selectedIndex === legacyQ.correctAnswer) {
            earnedPoints += q.points;
          }
        }
      }
    }

    return { earnedPoints, totalPoints };
  };

  const saveResult = () => {
    const { earnedPoints, totalPoints } = calculateScore();
    const pastExams = JSON.parse(localStorage.getItem('pastExams') || '[]');
    const hasWrittenQuestions = flattenedQuestions.some(q => q.type === 'WRITTEN');
    
    pastExams.push({
      id: Date.now().toString(),
      title: (exam as any).title || 'Untitled Exam',
      subject: (exam as any).subject || 'General',
      score: earnedPoints,
      maxScore: totalPoints,
      date: new Date().toISOString(),
      status: hasWrittenQuestions ? 'pending_review' : 'completed',
      answers: answers,
      questions: flattenedQuestions.map((q, idx) => ({
        text: q.text,
        type: q.type,
        points: q.points,
        userAnswer: answers[idx]
      }))
    });
    localStorage.setItem('pastExams', JSON.stringify(pastExams));
  };

  const handleSubmit = () => {
    saveResult();
    setSubmitted(true);
  };

  // Error display
  if (error) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
        <div style={{ backgroundColor: '#00bb00', padding: '12px 24px' }}>
          <div style={{ fontSize: '20px', color: 'white' }}>
            <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ color: '#c62828', marginBottom: '16px' }}>Error</h1>
            <p style={{ marginBottom: '24px', color: '#000' }}>{error}</p>
            <button 
              onClick={onComplete} 
              style={{ padding: '10px 20px', backgroundColor: '#00bb00', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Start Screen
  if (!examStarted) {
    const totalPoints = flattenedQuestions.reduce((sum, q) => sum + q.points, 0);
    const totalQuestions = flattenedQuestions.length;
    const minutes = Math.floor(timeLeft / 60);
    const examTitle = (exam as any).title || 'Untitled Exam';
    const examDescription = (exam as any).description;
    const securityLevel = (exam as Exam).conditions?.securityLevel || 'Open';
    const passingScore = (exam as Exam).conditions?.passingScore;
    
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
        <div style={{ backgroundColor: '#00bb00', padding: '12px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '20px', color: 'white' }}>
              <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold', marginBottom: '16px', color: '#000000' }}>{examTitle}</h1>
            {examDescription && (
              <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '16px', color: '#666666' }}>{examDescription}</p>
            )}
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '8px', color: '#000000' }}><strong>Format:</strong> {totalQuestions} questions, {totalPoints} points total</p>
              <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '8px', color: '#000000' }}><strong>Time Limit:</strong> {minutes} minutes</p>
              <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '8px', color: '#000000' }}><strong>Security Level:</strong> {securityLevel}</p>
              {passingScore && (
                <p style={{ fontFamily: 'Roboto, sans-serif', color: '#000000' }}><strong>Passing Score:</strong> {passingScore}%</p>
              )}
            </div>
            <button 
              onClick={() => setExamStarted(true)} 
              style={{ 
                fontFamily: 'Roboto, sans-serif',
                padding: '12px 24px', 
                backgroundColor: '#00bb00', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    const { earnedPoints, totalPoints } = calculateScore();
    const hasWrittenQuestions = flattenedQuestions.some(q => q.type === 'WRITTEN');
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passingScore = (exam as Exam).conditions?.passingScore;
    const passed = passingScore ? percentage >= passingScore : undefined;
    
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
          <h1 style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold', marginBottom: '16px', color: '#000000' }}>Exam Submitted</h1>
          
          {!hasWrittenQuestions && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: passed ? '#e8f5e9' : '#ffebee', borderRadius: '8px' }}>
              <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', fontWeight: 'bold', color: '#000000', marginBottom: '8px' }}>
                Score: {earnedPoints} / {totalPoints} ({percentage}%)
              </p>
              {passingScore && (
                <p style={{ fontFamily: 'Roboto, sans-serif', color: passed ? '#2e7d32' : '#c62828' }}>
                  {passed ? '✓ You passed!' : '✗ You did not pass this exam.'}
                </p>
              )}
            </div>
          )}
          
          {hasWrittenQuestions && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
              <p style={{ fontFamily: 'Roboto, sans-serif', color: '#000000', marginBottom: '8px' }}>
                Your exam has been submitted. Written responses will be reviewed by your instructor.
              </p>
            </div>
          )}
          
          <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '24px', color: '#000000' }}>
            Your device has been unlocked and you may exit.
          </p>
          
          <h3 style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 'bold', marginBottom: '8px', color: '#000000' }}>Reminders:</h3>
          <ul style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '32px', paddingLeft: '20px', color: '#000000' }}>
            <li>Do not distract candidates still testing.</li>
            <li>Maintain integrity of the test at all times.</li>
            <li>You may not return to this exam.</li>
            {hasWrittenQuestions && <li>Your written responses will be reviewed manually.</li>}
          </ul>
          
          <button 
            onClick={onComplete} 
            style={{ 
              fontFamily: 'Roboto, sans-serif',
              padding: '10px 20px', 
              backgroundColor: '#00bb00', 
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

  if (flattenedQuestions.length === 0) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
        <div style={{ backgroundColor: '#00bb00', padding: '12px 24px' }}>
          <div style={{ fontSize: '20px', color: 'white' }}>
            <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ color: '#c62828', marginBottom: '16px' }}>No Questions</h1>
            <p style={{ marginBottom: '24px', color: '#000' }}>This exam has no questions. Please add questions to the exam first.</p>
            <button onClick={onComplete} style={{ padding: '10px 20px', backgroundColor: '#00bb00', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = flattenedQuestions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft <= warningThreshold;
  
  const currentShuffled = currentQuestion?.type === 'MCQ' 
    ? shuffledOptions.get(currentQuestion.id) 
    : null;
  const options = currentShuffled?.options || [];
  const fixedLetter = currentShuffled?.fixedLetter;

  const handleAnswerSelect = (answer: string | number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < flattenedQuestions.length - 1) {
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

  // Legacy MCQ handler
  const handleLegacyMCQSelect = (index: number) => {
    handleAnswerSelect(index);
  };

  // Determine if MCQ should use radio (single) or checkbox (multiple)
  const isMultipleSelect = (question: Question): boolean => {
    return question.correctOptions ? question.correctOptions.length > 1 : false;
  };

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
      <div style={{ backgroundColor: '#00bb00', padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '20px', color: 'white' }}>
            <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
          </div>
          <div style={{ fontSize: isWarning ? '20px' : '18px', fontWeight: 'bold', color: isWarning ? '#ffcccc' : 'white' }}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <div style={{ fontSize: '14px', color: 'white' }}>
            Question {currentIndex + 1} of {flattenedQuestions.length}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        {currentQuestion.sectionPath && (
          <div style={{ marginBottom: '16px', fontSize: '12px', color: '#666666' }}>
            {currentQuestion.sectionPath}
          </div>
        )}
        
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: '#666666' }}>
              {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', lineHeight: '1.4', color: '#000000' }}>{currentQuestion.text}</h2>

          {/* MCQ - New format */}
          {currentQuestion.type === 'MCQ' && currentShuffled && options.length > 0 && (
            <div>
              {options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isFixed = fixedLetter === letter;
                const isSelected = (() => {
                  if (currentQuestion.originalQuestion.correctOptions) {
                    return selectedAnswer === opt;
                  } else {
                    return selectedAnswer === idx;
                  }
                })();
                
                return (
                  <div key={idx} style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start' }}>
                    <input
                      type={isMultipleSelect(currentQuestion.originalQuestion as Question) ? 'checkbox' : 'radio'}
                      name="question"
                      id={`opt_${idx}`}
                      checked={isSelected}
                      onChange={() => {
                        if (currentQuestion.originalQuestion.correctOptions) {
                          handleAnswerSelect(opt);
                        } else {
                          handleLegacyMCQSelect(idx);
                        }
                      }}
                      style={{ marginRight: '12px', marginTop: '2px', width: '18px', height: '18px', accentColor: '#00bb00', cursor: 'pointer' }}
                    />
                    <label htmlFor={`opt_${idx}`} style={{ fontSize: '16px', cursor: 'pointer', color: '#000000' }}>
                      <strong style={{ color: isFixed ? '#00bb00' : '#000000' }}>{letter}.</strong> {opt}
                      {isFixed && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#00bb00' }}>(fixed)</span>}
                    </label>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legacy MCQ fallback */}
          {currentQuestion.type === 'MCQ' && !currentShuffled && (currentQuestion.originalQuestion as LegacyQuestion).options && (
            <div>
              {((currentQuestion.originalQuestion as LegacyQuestion).options || []).map((opt, idx) => (
                <div key={idx} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="question"
                    id={`opt_${idx}`}
                    checked={selectedAnswer === idx}
                    onChange={() => handleLegacyMCQSelect(idx)}
                    style={{ marginRight: '12px', width: '18px', height: '18px', accentColor: '#00bb00', cursor: 'pointer' }}
                  />
                  <label htmlFor={`opt_${idx}`} style={{ fontSize: '16px', cursor: 'pointer', color: '#000000' }}>
                    <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Written Response */}
          {currentQuestion.type === 'WRITTEN' && (
            <div>
              {(currentQuestion.originalQuestion as Question).limits && (
                <div style={{ marginBottom: '16px', padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <p style={{ fontSize: '12px', color: '#666666' }}>
                    <strong>Response limits:</strong>{' '}
                    {(currentQuestion.originalQuestion as Question).limits?.mode === 'characters' && `Character limit`}
                    {(currentQuestion.originalQuestion as Question).limits?.mode === 'words' && `Word limit`}
                    {(currentQuestion.originalQuestion as Question).limits?.mode === 'both' && `Character and word limits`}
                    {(currentQuestion.originalQuestion as Question).limits?.min && ` Min: ${(currentQuestion.originalQuestion as Question).limits?.min}`}
                    {(currentQuestion.originalQuestion as Question).limits?.max && ` Max: ${(currentQuestion.originalQuestion as Question).limits?.max}`}
                  </p>
                </div>
              )}
              <textarea
                rows={10}
                style={{ width: '100%', padding: '12px', fontSize: '14px', fontFamily: 'Roboto, sans-serif', border: '1px solid #ccc', borderRadius: '4px', color: '#000000', backgroundColor: '#ffffff' }}
                value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                placeholder="Type your answer here..."
              />
              {(currentQuestion.originalQuestion as Question).limits?.max && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#666666', textAlign: 'right' }}>
                  {typeof selectedAnswer === 'string' ? selectedAnswer.length : 0} / {(currentQuestion.originalQuestion as Question).limits?.max} {(currentQuestion.originalQuestion as Question).limits?.mode === 'characters' ? 'characters' : 'words'}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: currentIndex === 0 ? '#ccc' : '#00bb00',
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
            style={{
              padding: '10px 20px',
              backgroundColor: '#00bb00',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {currentIndex < flattenedQuestions.length - 1 ? 'Next →' : 'Submit'}
          </button>
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {flattenedQuestions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                margin: '0 2px',
                cursor: 'pointer',
                backgroundColor: answers[idx] !== null ? '#00bb00' : (idx === currentIndex ? '#666666' : '#cccccc'),
                opacity: idx === currentIndex ? 1 : 0.6,
              }}
              aria-label={`Go to question ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}