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

interface TimeLimit {
  enabled: boolean;
  untimed: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface GroupNode {
  id: string;
  name: string;
  type: 'section' | 'module' | 'submodule';
  groups: GroupNode[];
  questions: ExamQuestion[];
  timeLimit?: TimeLimit;
}

interface ExamCondition {
  securityLevel: 'Open' | 'Protected' | 'Secure' | 'Very Secure' | 'Lockdown';
  globalTimeLimit?: TimeLimit;
  groupTimeLimits?: {
    groupId: string;
    groupName: string;
    groupPath: string;
    timeLimit: TimeLimit;
  }[];
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
  exam: Exam | LegacyExam | { exam: Exam };
  onComplete: () => void;
}

interface GroupWithQuestions {
  group: GroupNode;
  questions: FlattenedQuestion[];
  groupPath: string;
  timeLimit?: TimeLimit;
}

interface FlattenedQuestion {
  id: string;
  text: string;
  type: 'MCQ' | 'WRITTEN';
  points: number;
  originalQuestion: Question | LegacyQuestion;
  groupId: string;
  groupName: string;
  groupPath: string;
  groupType: string;
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

const calculateTimeLimitInSeconds = (timeLimit?: TimeLimit): number | null => {
  if (!timeLimit || !timeLimit.enabled) return null;
  if (timeLimit.untimed) return null;
  return timeLimit.days * 86400 + timeLimit.hours * 3600 + timeLimit.minutes * 60 + timeLimit.seconds;
};

const formatTimeDisplay = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export function ExamPlayer({ exam, onComplete }: ExamPlayerProps) {
  // Support both the legacy exam format and the newer JSON structure which wraps the exam under an "exam" key
  const examData: Exam | LegacyExam = (exam as any).exam ? (exam as any).exam : exam;
  
  // ALL HOOKS FIRST - before any conditional returns
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | number>>(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [warningThreshold] = useState(300);
  const [error, setError] = useState<string | null>(null);
  const [showGroupSidebar, setShowGroupSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [shuffledOptions, setShuffledOptions] = useState<Map<string, { options: string[]; fixedLetter?: string; fixedOption: string | null }>>(new Map());
  const [groupTimeRemaining, setGroupTimeRemaining] = useState<Map<string, number>>(new Map());

  // Helper functions - defined BEFORE effects that use them
  const getAnswerKey = (groupId: string, questionId: string) => `${groupId}_${questionId}`;
  
  const calculateScore = () => {
    let earnedPoints = 0;
    let totalPointsSum = 0;

    for (const group of groupsWithQuestions) {
      for (const q of group.questions) {
        totalPointsSum += q.points;
        const answer = answers.get(getAnswerKey(group.group.id, q.id));

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
    }

    return { earnedPoints, totalPoints: totalPointsSum };
  };

  const getAnsweredCount = () => {
    let count = 0;
    for (const group of groupsWithQuestions) {
      for (const q of group.questions) {
        if (answers.has(getAnswerKey(group.group.id, q.id))) {
          count++;
        }
      }
    }
    return count;
  };

  const saveResult = () => {
    const { earnedPoints, totalPoints: totalPointsSum } = calculateScore();
    const pastExams = JSON.parse(localStorage.getItem('pastExams') || '[]');
    const hasWrittenQuestions = groupsWithQuestions.some(g => g.questions.some(q => q.type === 'WRITTEN'));
    const answeredCount = getAnsweredCount();
    
    pastExams.push({
      id: Date.now().toString(),
      title: (examData as any).title || 'Untitled Exam',
      subject: (examData as any).subject || 'General',
      score: earnedPoints,
      maxScore: totalPointsSum,
      answered: answeredCount,
      totalQuestions: totalQuestions,
      date: new Date().toISOString(),
      status: hasWrittenQuestions ? 'pending_review' : 'completed',
      answers: Array.from(answers.entries()),
      groups: groupsWithQuestions.map(g => ({
        name: g.group.name,
        questions: g.questions.map(q => ({
          text: q.text,
          type: q.type,
          points: q.points
        }))
      }))
    });
    localStorage.setItem('pastExams', JSON.stringify(pastExams));
  };

  const handleSubmit = () => {
    saveResult();
    setSubmitted(true);
  };

  const handleAnswerSelect = (answer: string | number) => {
    if (!currentQuestion) return;
    const newAnswers = new Map(answers);
    newAnswers.set(getAnswerKey(currentGroup.group.id, currentQuestion.id), answer);
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (!currentGroup) return;
    if (currentQuestionIndex < currentGroup.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentGroupIndex < groupsWithQuestions.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      handleSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
      setCurrentQuestionIndex(groupsWithQuestions[currentGroupIndex - 1].questions.length - 1);
    }
  };

  const handleGoToGroup = (groupIndex: number) => {
    setCurrentGroupIndex(groupIndex);
    setCurrentQuestionIndex(0);
    if (window.innerWidth < 768) {
      setShowGroupSidebar(false);
    }
  };

  const handleGoToQuestion = (groupIndex: number, questionIndex: number) => {
    setCurrentGroupIndex(groupIndex);
    setCurrentQuestionIndex(questionIndex);
    if (window.innerWidth < 768) {
      setShowGroupSidebar(false);
    }
  };

  // Build group hierarchy and flatten questions by group - PRESERVING ORIGINAL JSON ORDER
  const { groupsWithQuestions, totalQuestions, totalPoints } = useMemo(() => {
    const isLegacy = (examData as any).questions && !(examData as Exam).sections;
    
    if (isLegacy) {
      const legacyExam = examData as LegacyExam;
      const legacyGroup: GroupWithQuestions = {
        group: { id: 'legacy', name: 'Exam', type: 'section', groups: [], questions: [] },
        questions: legacyExam.questions.map((q, idx) => ({
          id: q.id || `q${idx}`,
          text: q.text,
          type: q.type === 'mc' ? 'MCQ' as const : 'WRITTEN' as const,
          points: q.points || 1,
          originalQuestion: q,
          groupId: 'legacy',
          groupName: 'Exam',
          groupPath: 'Exam',
          groupType: 'section'
        })),
        groupPath: 'Exam'
      };
      const totalQ = legacyGroup.questions.length;
      const totalPts = legacyGroup.questions.reduce((sum, q) => sum + q.points, 0);
      return { groupsWithQuestions: [legacyGroup], totalQuestions: totalQ, totalPoints: totalPts };
    }
    
    const examWithSections = examData as Exam;
    if (!examWithSections.sections || examWithSections.sections.length === 0) {
      return { groupsWithQuestions: [], totalQuestions: 0, totalPoints: 0 };
    }
    
    // Create a map of group time limits from conditions
    const groupTimeLimitMap = new Map<string, TimeLimit>();
    if (examWithSections.conditions.groupTimeLimits) {
      for (const gtl of examWithSections.conditions.groupTimeLimits) {
        groupTimeLimitMap.set(gtl.groupId, gtl.timeLimit);
      }
    }
    
    // Also check for time limits directly on groups
    const getTimeLimitForGroup = (group: GroupNode): TimeLimit | undefined => {
      if (group.timeLimit?.enabled) return group.timeLimit;
      return groupTimeLimitMap.get(group.id);
    };
    
    const extractGroups = (groups: GroupNode[], path: string = ''): GroupWithQuestions[] => {
      let result: GroupWithQuestions[] = [];
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const currentPath = path ? `${path} > ${group.name}` : group.name;
        const groupQuestions: FlattenedQuestion[] = [];
        
        for (let qIdx = 0; qIdx < (group.questions || []).length; qIdx++) {
          const eq = (group.questions || [])[qIdx];
          if (eq.question) {
            groupQuestions.push({
              id: eq.id,
              text: eq.question.text,
              type: eq.question.type,
              points: eq.overridePoints || eq.question.points || 1,
              originalQuestion: eq.question,
              groupId: group.id,
              groupName: group.name,
              groupPath: currentPath,
              groupType: group.type
            });
          }
        }
        
        const timeLimit = getTimeLimitForGroup(group);
        
        if (groupQuestions.length > 0) {
          result.push({
            group,
            questions: groupQuestions,
            groupPath: currentPath,
            timeLimit
          });
        }
        
        if (group.groups && group.groups.length > 0) {
          result = result.concat(extractGroups(group.groups, currentPath));
        }
      }
      return result;
    };
    
    let allGroups = extractGroups(examWithSections.sections);
    
    // Only shuffle if auto mode is enabled
    if (examWithSections.conditions?.questionOrderMode === 'auto') {
      allGroups = shuffleArray(allGroups);
    }
    
    const totalQ = allGroups.reduce((sum, g) => sum + g.questions.length, 0);
    const totalPts = allGroups.reduce((sum, g) => sum + g.questions.reduce((qs, q) => qs + q.points, 0), 0);
    
    return { groupsWithQuestions: allGroups, totalQuestions: totalQ, totalPoints: totalPts };
  }, [examData]);

  // Get current group and question AFTER useMemo but BEFORE effects that use them
  const currentGroup = groupsWithQuestions[currentGroupIndex];
  const currentQuestion = currentGroup?.questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? answers.get(getAnswerKey(currentGroup.group.id, currentQuestion.id)) : null;

  // Timer effect
  useEffect(() => {
    if (!examStarted || submitted || timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        // Save current time for this group
        if (currentGroup) {
          setGroupTimeRemaining(prevMap => new Map(prevMap).set(currentGroup.group.id, prev - 1));
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, submitted, timeLeft, currentGroup]);

  // Initialize time for the first group
  useEffect(() => {
    if (groupsWithQuestions.length > 0 && timeLeft === null && examStarted && currentGroup) {
      let groupTimeLimit = currentGroup.timeLimit;
      
      // If no group time limit, check global time limit
      if (!groupTimeLimit?.enabled) {
        const examWithConditions = examData as Exam;
        groupTimeLimit = examWithConditions.conditions.globalTimeLimit;
      }
      
      const seconds = calculateTimeLimitInSeconds(groupTimeLimit);
      if (seconds !== null && seconds > 0) {
        // Check if we have saved time for this group
        const savedTime = groupTimeRemaining.get(currentGroup.group.id);
        setTimeLeft(savedTime !== undefined ? savedTime : seconds);
      } else {
        setTimeLeft(null);
      }
    }
  }, [groupsWithQuestions, examStarted, timeLeft, currentGroup]);

  // Update time limit when switching groups
  useEffect(() => {
    if (!examStarted || !currentGroup) return;
    
    let groupTimeLimit = currentGroup.timeLimit;
    if (!groupTimeLimit?.enabled) {
      const examWithConditions = examData as Exam;
      groupTimeLimit = examWithConditions.conditions.globalTimeLimit;
    }
    
    const seconds = calculateTimeLimitInSeconds(groupTimeLimit);
    if (seconds !== null && seconds > 0) {
      // Check if we have saved time for this group
      const savedTime = groupTimeRemaining.get(currentGroup.group.id);
      setTimeLeft(savedTime !== undefined ? savedTime : seconds);
    } else {
      setTimeLeft(null);
    }
  }, [currentGroupIndex, examStarted, groupsWithQuestions]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 0 && !submitted && examStarted) {
      handleSubmit();
    }
  }, [timeLeft, submitted, examStarted]);

  // Pre-shuffle options for MCQ questions
  useEffect(() => {
    if (groupsWithQuestions.length === 0) return;
    
    const optionsMap = new Map();
    for (const group of groupsWithQuestions) {
      for (const q of group.questions) {
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
    }
    setShuffledOptions(optionsMap);
  }, [groupsWithQuestions]);

  // Set loading to false once groups are processed
  useEffect(() => {
    setLoading(false);
  }, [groupsWithQuestions]);

  // Set error if no questions
  useEffect(() => {
    if (!loading && groupsWithQuestions.length === 0 && totalQuestions === 0) {
      const isLegacy = (examData as any).questions && !(examData as Exam).sections;
      if (!isLegacy) {
        const examWithSections = examData as Exam;
        if (!examWithSections.sections || examWithSections.sections.length === 0) {
          setError('This exam has no sections. Please add sections to the exam first.');
        } else {
          setError('This exam has no questions. Please add questions to the exam first.');
        }
      }
    } else {
      setError(null);
    }
  }, [groupsWithQuestions, totalQuestions, examData, loading]);

  // Get section label from path
  const currentSectionLabel = useMemo(() => {
    if (!currentGroup) return '';
    const pathParts = currentGroup.groupPath.split(' > ');
    if (pathParts.length > 1) {
      const sameSectionGroups = groupsWithQuestions.filter(g => {
        const parts = g.groupPath.split(' > ');
        return parts[0] === pathParts[0] && parts.length > 1;
      });
      const moduleNumber = sameSectionGroups.findIndex(g => g.group.id === currentGroup.group.id) + 1;
      const sectionNumber = groupsWithQuestions.filter(g => {
        const parts = g.groupPath.split(' > ');
        return parts.length === 1;
      }).findIndex(g => g.groupPath === pathParts[0]) + 1;
      return `Section ${sectionNumber}, Module ${moduleNumber}`;
    }
    const sectionNumber = groupsWithQuestions.findIndex(g => g.groupPath === currentGroup.groupPath) + 1;
    return `Section ${sectionNumber}`;
  }, [currentGroup, groupsWithQuestions]);

  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;
  const isWarning = timeLeft !== null && timeLeft <= warningThreshold;
  const answeredCount = getAnsweredCount();
  
  const currentShuffled = currentQuestion?.type === 'MCQ' 
    ? shuffledOptions.get(currentQuestion.id) 
    : null;
  const options = currentShuffled?.options || [];
  const fixedLetter = currentShuffled?.fixedLetter;

  const isMultipleSelect = (question: Question): boolean => {
    return question.correctOptions ? question.correctOptions.length > 1 : false;
  };

  const getTimeDisplay = () => {
    if (timeLeft === null) return 'No limit';
    return formatTimeDisplay(timeLeft);
  };

  // Conditional returns
  if (loading) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>Loading exam...</div>
          <div style={{ width: '40px', height: '40px', border: '3px solid #00c462', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
        <div style={{ backgroundColor: '#00c462', padding: '12px 24px' }}>
          <div style={{ fontSize: '20px', color: 'white' }}>
            <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ color: '#c62828', marginBottom: '16px' }}>Error</h1>
            <p style={{ marginBottom: '24px', color: '#000' }}>{error}</p>
            <button onClick={onComplete} style={{ padding: '10px 20px', backgroundColor: '#00c462', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    const examTitle = (examData as any).title || 'Untitled Exam';
    const examDescription = (examData as any).description;
    const securityLevel = (examData as Exam).conditions?.securityLevel || 'Open';
    const passingScore = (examData as Exam).conditions?.passingScore;
    const globalTimeLimit = (examData as Exam).conditions?.globalTimeLimit;
    const globalTimeDisplay = globalTimeLimit?.enabled && !globalTimeLimit?.untimed 
      ? `${globalTimeLimit.minutes} minutes` 
      : (globalTimeLimit?.untimed ? 'Untimed' : 'No limit');
    
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
        <div style={{ backgroundColor: '#00c462', padding: '12px 24px' }}>
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
              <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '8px', color: '#000000' }}><strong>Format:</strong> {groupsWithQuestions.length} sections, {totalQuestions} questions, {totalPoints} points total</p>
              <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '8px', color: '#000000' }}><strong>Global Time Limit:</strong> {globalTimeDisplay}</p>
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
                backgroundColor: '#00c462', 
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
    const { earnedPoints, totalPoints: totalPointsSum } = calculateScore();
    const hasWrittenQuestions = groupsWithQuestions.some(g => g.questions.some(q => q.type === 'WRITTEN'));
    const percentage = totalPointsSum > 0 ? Math.round((earnedPoints / totalPointsSum) * 100) : 0;
    const passingScore = (examData as Exam).conditions?.passingScore;
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
          
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '8px', color: '#000000' }}>
              <strong>Completed:</strong> {answeredCount} / {totalQuestions} questions
            </p>
          </div>
          
          {!hasWrittenQuestions && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: passed ? '#e8f5e9' : '#ffebee', borderRadius: '8px' }}>
              <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', fontWeight: 'bold', color: '#000000', marginBottom: '8px' }}>
                Score: {earnedPoints} / {totalPointsSum} ({percentage}%)
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
              backgroundColor: '#00c462', 
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

  if (groupsWithQuestions.length === 0 || !currentGroup) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
        <div style={{ backgroundColor: '#00c462', padding: '12px 24px' }}>
          <div style={{ fontSize: '20px', color: 'white' }}>
            <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ color: '#c62828', marginBottom: '16px' }}>No Questions</h1>
            <p style={{ marginBottom: '24px', color: '#000' }}>This exam has no questions. Please add questions to the exam first.</p>
            <button onClick={onComplete} style={{ padding: '10px 20px', backgroundColor: '#00c462', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Main exam UI
  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
      <div style={{ backgroundColor: '#00c462', padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '20px', color: 'white' }}>
            <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
          </div>
          <div style={{ fontSize: isWarning ? '20px' : '18px', fontWeight: 'bold', color: isWarning ? '#ffcccc' : 'white' }}>
            {getTimeDisplay()}
          </div>
          <div style={{ fontSize: '14px', color: 'white' }}>
            {answeredCount}/{totalQuestions} answered
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar */}
        <div style={{ 
          width: showGroupSidebar ? '280px' : '0',
          overflow: 'hidden',
          transition: 'width 0.2s',
          borderRight: showGroupSidebar ? '1px solid #e0e0e0' : 'none',
          backgroundColor: '#fafafa'
        }}>
          {showGroupSidebar && (
            <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
              <button 
                onClick={() => setShowGroupSidebar(false)}
                style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666' }}
              >
                ×
              </button>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#000000' }}>Sections</h3>
              {groupsWithQuestions.map((group, gIdx) => {
                const groupAnswered = group.questions.filter(q => answers.has(getAnswerKey(group.group.id, q.id))).length;
                const isActive = gIdx === currentGroupIndex;
                const pathParts = group.groupPath.split(' > ');
                const isModule = pathParts.length > 1;
                const indent = isModule ? '20px' : '0';
                const displayName = isModule ? `  ${group.group.name}` : group.group.name;
                const hasTimeLimit = group.timeLimit?.enabled && !group.timeLimit?.untimed;
                const timeLimitDisplay = hasTimeLimit ? `(${group.timeLimit?.minutes}m)` : '';
                
                return (
                  <div key={group.group.id} style={{ marginBottom: '8px', marginLeft: indent }}>
                    <div 
                      onClick={() => handleGoToGroup(gIdx)}
                      style={{ 
                        padding: '8px 10px', 
                        backgroundColor: isActive ? '#e8f5e9' : 'transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        borderLeft: isActive ? `3px solid #00c462` : '3px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: '#000000', fontSize: '13px' }}>
                          {displayName} {timeLimitDisplay}
                        </span>
                        <span style={{ fontSize: '11px', color: '#666' }}>{groupAnswered}/{group.questions.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Question content */}
        <div style={{ flex: 1, padding: '40px 24px', maxWidth: showGroupSidebar ? 'calc(100% - 280px)' : '100%', margin: '0 auto' }}>
          {!showGroupSidebar && (
            <button 
              onClick={() => setShowGroupSidebar(true)}
              style={{ marginBottom: '16px', padding: '6px 12px', backgroundColor: '#00c462', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              ☰ Show Sections
            </button>
          )}
          
          <div style={{ marginBottom: '16px', fontSize: '12px', color: '#666666' }}>
            {currentGroup.groupPath}
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#666666' }}>
                Question {currentQuestionIndex + 1} of {currentGroup.questions.length} • {currentQuestion?.points} {currentQuestion?.points === 1 ? 'point' : 'points'}
              </span>
              <span style={{ fontSize: '12px', color: '#666666' }}>
                {currentSectionLabel}
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', lineHeight: '1.4', color: '#000000', fontFamily: 'Roboto' }}>{currentQuestion?.text}</h2>

            {currentQuestion?.type === 'MCQ' && currentShuffled && options.length > 0 && (
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
                            handleAnswerSelect(idx);
                          }
                        }}
                        style={{ marginRight: '12px', marginTop: '2px', width: '18px', height: '18px', accentColor: '#00c462', cursor: 'pointer' }}
                      />
                      <label htmlFor={`opt_${idx}`} style={{ fontSize: '16px', cursor: 'pointer', color: '#000000' }}>
                        <strong style={{ color: isFixed ? '#00c462' : '#000000' }}>{letter}.</strong> {opt}
                        {isFixed && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#00c462' }}>(fixed)</span>}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQuestion?.type === 'MCQ' && !currentShuffled && (currentQuestion.originalQuestion as LegacyQuestion).options && (
              <div>
                {((currentQuestion.originalQuestion as LegacyQuestion).options || []).map((opt, idx) => (
                  <div key={idx} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="question"
                      id={`opt_${idx}`}
                      checked={selectedAnswer === idx}
                      onChange={() => handleAnswerSelect(idx)}
                      style={{ marginRight: '12px', width: '18px', height: '18px', accentColor: '#00c462', cursor: 'pointer' }}
                    />
                    <label htmlFor={`opt_${idx}`} style={{ fontSize: '16px', cursor: 'pointer', color: '#000000' }}>
                      <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {currentQuestion?.type === 'WRITTEN' && (
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
              onClick={handlePreviousQuestion}
              disabled={currentGroupIndex === 0 && currentQuestionIndex === 0}
              style={{
                padding: '10px 20px',
                backgroundColor: (currentGroupIndex === 0 && currentQuestionIndex === 0) ? '#ccc' : '#00c462',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (currentGroupIndex === 0 && currentQuestionIndex === 0) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              ← Previous
            </button>
            <button
              onClick={handleNextQuestion}
              style={{
                padding: '10px 20px',
                backgroundColor: '#00c462',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              {(currentGroupIndex === groupsWithQuestions.length - 1 && currentQuestionIndex === currentGroup.questions.length - 1) ? 'Submit' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}