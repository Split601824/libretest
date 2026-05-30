import React, { useState, useEffect, useMemo } from 'react';
import { BreakScreen } from './BreakScreen';

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

interface BreakConfig {
  enabled: boolean;
  durationMinutes?: number;
  message: string;
  allowEarlyContinue: boolean;
}

interface SubmitControl {
  mode: 'early' | 'auto-only' | 'after-time';
  minMinutes?: number;
}

interface GroupNode {
  id: string;
  name: string;
  type: 'section' | 'module' | 'submodule';
  groups: GroupNode[];
  questions: ExamQuestion[];
  timeLimit?: TimeLimit;
  breakAfter?: BreakConfig;
  submitControl?: SubmitControl;
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
  shuffleAnswers: boolean;
  questionOrderMode?: 'manual' | 'auto';
  submitControl?: SubmitControl;
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

interface FlatQuestion {
  id: string;
  text: string;
  type: 'MCQ' | 'WRITTEN';
  points: number;
  originalQuestion: Question | LegacyQuestion;
  groupId: string;
  groupName: string;
  groupPath: string[];
  timeLimit?: TimeLimit;
  globalIndex: number;
}

interface GroupInfo {
  id: string;
  name: string;
  path: string[];
  questions: FlatQuestion[];
  timeLimit?: TimeLimit;
  breakAfter?: BreakConfig;
  submitControl?: SubmitControl;
  startIndex: number;
  endIndex: number;
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
  const examData: Exam | LegacyExam = (exam as any).exam ? (exam as any).exam : exam;
  
  // State
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | number>>(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [groupStarted, setGroupStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [warningThreshold] = useState(300);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shuffledOptions, setShuffledOptions] = useState<Map<string, { options: string[]; fixedLetter?: string; fixedOption: string | null }>>(new Map());
  const [groupTimeRemaining, setGroupTimeRemaining] = useState<Map<string, number>>(new Map());
  const [groupStartTime, setGroupStartTime] = useState<number | null>(null);
  
  // Break state
  const [showBreakScreen, setShowBreakScreen] = useState(false);
  const [pendingBreakConfig, setPendingBreakConfig] = useState<BreakConfig | null>(null);
  const [pendingGroupName, setPendingGroupName] = useState<string>('');
  const [pendingGroupPath, setPendingGroupPath] = useState<string>('');
  const [pendingNextGroupIndex, setPendingNextGroupIndex] = useState<number | null>(null);

  // Get submit control configuration for current group (with fallback to exam-level)
  const getSubmitControlForGroup = (group: GroupInfo | null): SubmitControl => {
    if (group?.submitControl?.mode) {
      return group.submitControl;
    }
    const examWithConditions = examData as Exam;
    return examWithConditions.conditions?.submitControl || { mode: 'early' };
  };

  // Get min minutes for time-locked submission
  const getMinMinutesForGroup = (group: GroupInfo | null): number => {
    const submitControl = getSubmitControlForGroup(group);
    if (submitControl.mode === 'after-time' && submitControl.minMinutes) {
      return submitControl.minMinutes;
    }
    return 0;
  };

  const getAnswerKey = (groupId: string, questionId: string) => `${groupId}_${questionId}`;

  // Build groups and flattened questions
  const { groups, totalQuestions, totalPoints } = useMemo(() => {
    const isLegacy = (examData as any).questions && !(examData as Exam).sections;
    
    if (isLegacy) {
      const legacyExam = examData as LegacyExam;
      const legacyQuestions: FlatQuestion[] = legacyExam.questions.map((q, idx) => ({
        id: q.id || `q${idx}`,
        text: q.text,
        type: q.type === 'mc' ? 'MCQ' as const : 'WRITTEN' as const,
        points: q.points || 1,
        originalQuestion: q,
        groupId: 'legacy',
        groupName: 'Exam',
        groupPath: ['Exam'],
        globalIndex: idx
      }));
      const totalQ = legacyQuestions.length;
      const totalPts = legacyQuestions.reduce((sum, q) => sum + q.points, 0);
      
      const legacyGroup: GroupInfo = {
        id: 'legacy',
        name: 'Exam',
        path: ['Exam'],
        questions: legacyQuestions,
        startIndex: 0,
        endIndex: totalQ - 1
      };
      
      return { groups: [legacyGroup], totalQuestions: totalQ, totalPoints: totalPts };
    }
    
    const examWithSections = examData as Exam;
    if (!examWithSections.sections || examWithSections.sections.length === 0) {
      return { groups: [], totalQuestions: 0, totalPoints: 0 };
    }
    
    // Build time limit map
    const timeLimitMap = new Map<string, TimeLimit>();
    if (examWithSections.conditions.groupTimeLimits) {
      for (const gtl of examWithSections.conditions.groupTimeLimits) {
        timeLimitMap.set(gtl.groupId, gtl.timeLimit);
      }
    }
    
    const getTimeLimitForGroup = (groupId: string, groupTimeLimit?: TimeLimit): TimeLimit | undefined => {
      if (groupTimeLimit?.enabled) return groupTimeLimit;
      return timeLimitMap.get(groupId);
    };
    
    let globalQuestionIndex = 0;
    const flatQuestionsList: FlatQuestion[] = [];
    const groupList: GroupInfo[] = [];
    
    const processGroup = (group: GroupNode, path: string[]): GroupInfo | null => {
      const currentPath = [...path, group.name];
      const groupId = group.id;
      const timeLimit = getTimeLimitForGroup(groupId, group.timeLimit);
      const breakAfter = group.breakAfter;
      const submitControl = group.submitControl;
      
      const groupQuestions: FlatQuestion[] = [];
      for (const eq of group.questions) {
        if (eq.question) {
          const flatQ: FlatQuestion = {
            id: eq.id,
            text: eq.question.text,
            type: eq.question.type,
            points: eq.overridePoints || eq.question.points || 1,
            originalQuestion: eq.question,
            groupId: groupId,
            groupName: group.name,
            groupPath: currentPath,
            timeLimit,
            globalIndex: globalQuestionIndex++
          };
          groupQuestions.push(flatQ);
          flatQuestionsList.push(flatQ);
        }
      }
      
      // Process children first - they become separate groups (modules after section)
      for (const childGroup of group.groups) {
        const childInfo = processGroup(childGroup, currentPath);
        if (childInfo && childInfo.questions.length > 0) {
          groupList.push(childInfo);
        }
      }
      
      if (groupQuestions.length === 0) return null;
      
      return {
        id: groupId,
        name: group.name,
        path: currentPath,
        questions: groupQuestions,
        timeLimit,
        breakAfter,
        submitControl,
        startIndex: groupQuestions[0].globalIndex,
        endIndex: groupQuestions[groupQuestions.length - 1].globalIndex
      };
    };
    
    // Process sections in order
    for (const section of examWithSections.sections) {
      const sectionInfo = processGroup(section, []);
      if (sectionInfo && sectionInfo.questions.length > 0) {
        groupList.push(sectionInfo);
      }
    }
    
    const totalQ = flatQuestionsList.length;
    const totalPts = flatQuestionsList.reduce((sum, q) => sum + q.points, 0);
    
    return { groups: groupList, totalQuestions: totalQ, totalPoints: totalPts };
  }, [examData]);

  const currentGroup = groups[currentGroupIndex];
  const currentQuestion = currentGroup?.questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? answers.get(getAnswerKey(currentGroup.id, currentQuestion.id)) : null;
  const currentSubmitControl = getSubmitControlForGroup(currentGroup);
  const currentMinMinutes = getMinMinutesForGroup(currentGroup);

  // Check if minimum time has been met
  const isMinimumTimeMet = (): boolean => {
    if (currentMinMinutes <= 0) return true;
    if (groupStartTime === null) return false;
    const elapsedSeconds = (Date.now() - groupStartTime) / 1000;
    return elapsedSeconds >= currentMinMinutes * 60;
  };

  // Check if current group has a break configured
  const shouldShowBreakAfterGroup = (group: GroupInfo): boolean => {
    return group.breakAfter?.enabled === true;
  };

  // Handler for when time expires (auto-submit for current group)
  const handleGroupTimeExpired = () => {
    const submitControl = currentSubmitControl;
    if (submitControl.mode === 'auto-only' || submitControl.mode === 'after-time') {
      // Auto-submit to next group or finish exam
      moveToNextGroupOrSubmit();
    }
  };

  // Move to next group or submit the exam
  const moveToNextGroupOrSubmit = () => {
    if (!currentGroup) return;
    
    // Check if there's a break after current group
    if (shouldShowBreakAfterGroup(currentGroup)) {
      setPendingBreakConfig(currentGroup.breakAfter!);
      setPendingGroupName(currentGroup.name);
      setPendingGroupPath(currentGroup.path.join(' > '));
      setPendingNextGroupIndex(currentGroupIndex + 1);
      setShowBreakScreen(true);
      return;
    }
    
    // Move to next group
    if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentQuestionIndex(0);
      setGroupStarted(false);
      setTimeLeft(null);
      setGroupStartTime(null);
    } else {
      // End of exam - submit
      saveResult();
      setSubmitted(true);
    }
  };

  // Save result to localStorage
  const saveResult = () => {
    const { earnedPoints, totalPoints: totalPointsSum } = calculateScore();
    const pastExams = JSON.parse(localStorage.getItem('pastExams') || '[]');
    const hasWrittenQuestions = groups.some(g => g.questions.some(q => q.type === 'WRITTEN'));
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
    });
    localStorage.setItem('pastExams', JSON.stringify(pastExams));
  };

  const handleSubmitExam = () => {
    // Check if manual submit is allowed for current group
    if (currentSubmitControl.mode === 'auto-only') {
      alert('This section does not allow manual submission. The exam will advance automatically when the time expires.');
      return;
    }
    
    // For time-locked submission, check minimum time
    if (currentSubmitControl.mode === 'after-time' && !isMinimumTimeMet()) {
      const remainingMinutes = Math.ceil(currentMinMinutes - ((Date.now() - (groupStartTime || Date.now())) / 60000));
      alert(`You must wait ${remainingMinutes} more minute(s) before submitting this section.`);
      return;
    }
    
    // Check if we're at the end of the exam
    if (currentGroupIndex === groups.length - 1 && 
        currentQuestionIndex === currentGroup?.questions.length - 1) {
      saveResult();
      setSubmitted(true);
    } else {
      moveToNextGroupOrSubmit();
    }
  };

  const calculateScore = () => {
    let earnedPoints = 0;
    let totalPointsSum = 0;

    for (const group of groups) {
      for (const q of group.questions) {
        totalPointsSum += q.points;
        const answer = answers.get(getAnswerKey(q.groupId, q.id));

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
    for (const group of groups) {
      for (const q of group.questions) {
        if (answers.has(getAnswerKey(q.groupId, q.id))) {
          count++;
        }
      }
    }
    return count;
  };

  const handleAnswerSelect = (answer: string | number) => {
    if (!currentQuestion) return;
    const newAnswers = new Map(answers);
    newAnswers.set(getAnswerKey(currentGroup.id, currentQuestion.id), answer);
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (!currentGroup) return;
    
    // Move to next question in current group
    if (currentQuestionIndex < currentGroup.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of group - check submit control mode
      if (currentSubmitControl.mode === 'auto-only') {
        // In auto-only mode, we don't automatically move to next group
        // The user must wait for timer or we auto-advance on timer expiry
        alert('This section requires you to complete all questions before the time expires. The exam will advance automatically when time is up.');
        return;
      }
      
      // For after-time mode, check minimum time
      if (currentSubmitControl.mode === 'after-time' && !isMinimumTimeMet()) {
        const remainingMinutes = Math.ceil(currentMinMinutes - ((Date.now() - (groupStartTime || Date.now())) / 60000));
        alert(`You must wait ${remainingMinutes} more minute(s) before finishing this section.`);
        return;
      }
      
      // For early mode or when minimum time is met, move to next group or break
      moveToNextGroupOrSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
      setCurrentQuestionIndex(groups[currentGroupIndex - 1].questions.length - 1);
    }
  };

  const handleGroupStart = () => {
    setGroupStartTime(Date.now());
    setGroupStarted(true);
  };

  const handleBreakComplete = () => {
    setShowBreakScreen(false);
    setPendingBreakConfig(null);
    setPendingGroupName('');
    setPendingGroupPath('');
    
    // Move to next group after break
    if (pendingNextGroupIndex !== null && pendingNextGroupIndex < groups.length) {
      setCurrentGroupIndex(pendingNextGroupIndex);
      setCurrentQuestionIndex(0);
      setGroupStarted(false);
      setTimeLeft(null);
      setGroupStartTime(null);
      setPendingNextGroupIndex(null);
    } else if (pendingNextGroupIndex !== null && pendingNextGroupIndex >= groups.length) {
      saveResult();
      setSubmitted(true);
    }
  };

  // Shuffle MCQ options ONLY
  useEffect(() => {
    if (groups.length === 0) return;
    
    const optionsMap = new Map();
    const shouldShuffleAnswers = (examData as Exam).conditions?.shuffleAnswers ?? true;
    
    for (const group of groups) {
      for (const q of group.questions) {
        if (q.type === 'MCQ') {
          const originalQ = q.originalQuestion as Question;
          if (originalQ.correctOptions && originalQ.correctOptions.length > 0 && originalQ.incorrectOptions) {
            if (shouldShuffleAnswers) {
              const shuffled = shuffleOptionsWithFixed(
                originalQ.correctOptions,
                originalQ.incorrectOptions,
                originalQ.fixedOptionIndex,
                originalQ.fixedOptionText
              );
              optionsMap.set(q.id, shuffled);
            } else {
              const allOptions = [...originalQ.correctOptions, ...originalQ.incorrectOptions];
              optionsMap.set(q.id, { options: allOptions, fixedLetter: undefined, fixedOption: null });
            }
          } else if ((q.originalQuestion as LegacyQuestion).options) {
            const legacyQ = q.originalQuestion as LegacyQuestion;
            const allOptions = legacyQ.options || [];
            const correctAnswerIndex = legacyQ.correctAnswer;
            const correctOption = correctAnswerIndex !== undefined ? allOptions[correctAnswerIndex] : null;
            const incorrectOptions = allOptions.filter((_, idx) => idx !== correctAnswerIndex);
            
            if (shouldShuffleAnswers) {
              const shuffled = shuffleOptionsWithFixed(
                correctOption ? [correctOption] : [],
                incorrectOptions,
                undefined,
                undefined
              );
              optionsMap.set(q.id, shuffled);
            } else {
              optionsMap.set(q.id, { options: allOptions, fixedLetter: undefined, fixedOption: null });
            }
          }
        }
      }
    }
    setShuffledOptions(optionsMap);
  }, [groups, examData]);

  // Timer effect - handles auto-submit on expiration for current group
  useEffect(() => {
    if (!examStarted || !groupStarted || submitted || timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Time expired for this group!
          handleGroupTimeExpired();
          return 0;
        }
        if (currentGroup) {
          setGroupTimeRemaining(prevMap => new Map(prevMap).set(currentGroup.id, prev - 1));
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, groupStarted, submitted, timeLeft, currentGroup]);

  // Initialize time when group starts
  useEffect(() => {
    if (groupStarted && currentGroup && timeLeft === null) {
      let timeLimit = currentGroup.timeLimit;
      if (!timeLimit?.enabled) {
        const examWithConditions = examData as Exam;
        timeLimit = examWithConditions.conditions.globalTimeLimit;
      }
      const seconds = calculateTimeLimitInSeconds(timeLimit);
      if (seconds !== null && seconds > 0) {
        const savedTime = groupTimeRemaining.get(currentGroup.id);
        setTimeLeft(savedTime !== undefined ? savedTime : seconds);
      } else {
        setTimeLeft(null);
      }
    }
  }, [groupStarted, currentGroup, examData]);

  useEffect(() => {
    setLoading(false);
  }, [groups]);

  useEffect(() => {
    if (!loading && groups.length === 0 && totalQuestions === 0) {
      setError('This exam has no questions. Please add questions first.');
    }
  }, [groups, totalQuestions, loading]);

  const currentPathDisplay = currentGroup?.path.join(' > ') || '';
  const currentGroupProgress = currentGroup ? `${currentQuestionIndex + 1} of ${currentGroup.questions.length}` : '';
  const answeredCount = getAnsweredCount();
  const isWarning = timeLeft !== null && timeLeft <= warningThreshold;
  
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

  // Check if manual submit button should be shown
  const showManualSubmitButton = currentSubmitControl.mode !== 'auto-only';
  
  // Check if "Submit" button text should be shown on next button
  const isLastQuestion = currentGroupIndex === groups.length - 1 && 
                         currentQuestionIndex === currentGroup?.questions.length - 1;
  const nextButtonText = isLastQuestion 
    ? (showManualSubmitButton ? 'Submit Exam' : 'Complete')
    : 'Next →';

  // Calculate elapsed time for minimum time display
  const getElapsedTimeDisplay = () => {
    if (groupStartTime === null || currentMinMinutes <= 0) return null;
    const elapsedSeconds = (Date.now() - groupStartTime) / 1000;
    const remainingSeconds = Math.max(0, currentMinMinutes * 60 - elapsedSeconds);
    if (remainingSeconds <= 0) return null;
    return formatTimeDisplay(remainingSeconds);
  };

  // Break screen
  if (showBreakScreen && pendingBreakConfig) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif' }}>
        <BreakScreen
          breakConfig={pendingBreakConfig}
          groupName={pendingGroupName}
          groupPath={pendingGroupPath}
          onContinue={handleBreakComplete}
        />
      </div>
    );
  }

  // Group start screen
  if (!groupStarted && examStarted && currentGroup) {
    const totalGroupPoints = currentGroup.questions.reduce((sum, q) => sum + q.points, 0);
    const hasTimeLimit = currentGroup.timeLimit?.enabled && !currentGroup.timeLimit?.untimed;
    const timeDisplay = hasTimeLimit ? `${currentGroup.timeLimit?.minutes} minutes` : (currentGroup.timeLimit?.untimed ? 'Untimed' : 'No limit');
    
    // Show submission mode hint on group start screen
    let submissionHint = '';
    if (currentSubmitControl.mode === 'auto-only') {
      submissionHint = 'This section will auto-advance when time expires. You cannot manually submit.';
    } else if (currentSubmitControl.mode === 'after-time') {
      if (currentMinMinutes > 0) {
        const maxTime = hasTimeLimit ? `${currentGroup.timeLimit?.minutes} minutes` : 'the time limit';
        submissionHint = `This section requires a minimum of ${currentMinMinutes} minutes. You can finish early after ${currentMinMinutes} minutes, or it will auto-submit when ${maxTime} expires.`;
      } else {
        submissionHint = 'This section will auto-advance when time expires.';
      }
    } else {
      submissionHint = 'You may advance to the next section when finished.';
    }
    
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#ffffff', minHeight: '100vh', color: '#000000' }}>
        <div style={{ backgroundColor: '#00b000', padding: '12px 24px' }}>
          <div style={{ fontSize: '20px', color: '#ffffff' }}>
            <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'Roboto, sans-serif', marginBottom: '16px', color: '#000000' }}>{currentGroup.name}</h1>
            <div style={{ fontSize: '14px', color: '#666666', marginBottom: '24px' }}>{currentGroup.path.join(' > ')}</div>
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <p style={{ marginBottom: '8px', color: '#000000' }}><strong>Format:</strong> {currentGroup.questions.length} questions, {totalGroupPoints} points</p>
              <p style={{ marginBottom: '8px', color: '#000000' }}><strong>Time Limit:</strong> {timeDisplay}</p>
              {currentMinMinutes > 0 && (
                <p style={{ marginBottom: '8px', color: '#000000' }}><strong>Minimum Time Required:</strong> {currentMinMinutes} minutes</p>
              )}
              <p style={{ marginBottom: '0', color: '#666666', fontSize: '12px' }}>{submissionHint}</p>
            </div>
            <button onClick={handleGroupStart} style={{ padding: '12px 24px', backgroundColor: '#00b000', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Start {currentGroup.name}</button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#ffffff', minHeight: '100vh', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>Loading exam...</div>
          <div style={{ width: '40px', height: '40px', border: '3px solid #00b000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#ffffff', minHeight: '100vh', color: '#000000' }}>
        <div style={{ backgroundColor: '#00b000', padding: '12px 24px' }}>
          <div style={{ fontSize: '20px', color: '#ffffff' }}>
            <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ color: '#c62828', marginBottom: '16px' }}>Error</h1>
            <p style={{ marginBottom: '24px', color: '#000000' }}>{error}</p>
            <button onClick={onComplete} style={{ padding: '10px 20px', backgroundColor: '#00b000', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Start screen
  if (!examStarted) {
    const examTitle = (examData as any).title || 'Untitled Exam';
    const examDescription = (examData as any).description;
    const securityLevel = (examData as Exam).conditions?.securityLevel || 'Open';
    const passingScore = (examData as Exam).conditions?.passingScore;
    const globalTimeLimit = (examData as Exam).conditions?.globalTimeLimit;
    const globalTimeDisplay = globalTimeLimit?.enabled && !globalTimeLimit?.untimed 
      ? `${globalTimeLimit.minutes} minutes` 
      : (globalTimeLimit?.untimed ? 'Untimed' : 'No limit');
    const shuffleAnswers = (examData as Exam).conditions?.shuffleAnswers ?? true;
    
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#ffffff', minHeight: '100vh', color: '#000000' }}>
        <div style={{ backgroundColor: '#00b000', padding: '12px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '20px', color: '#ffffff' }}>
              <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'Roboto, sans-serif', marginBottom: '16px', color: '#000000' }}>{examTitle}</h1>
            {examDescription && <p style={{ marginBottom: '16px', color: '#666666' }}>{examDescription}</p>}
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <p style={{ marginBottom: '8px', color: '#000000' }}><strong>Format:</strong> {groups.length} sections, {totalQuestions} questions, {totalPoints} points</p>
              <p style={{ marginBottom: '8px', color: '#000000' }}><strong>Global Time Limit:</strong> {globalTimeDisplay}</p>
              <p style={{ marginBottom: '8px', color: '#000000' }}><strong>Security Level:</strong> {securityLevel}</p>
              <p style={{ marginBottom: '0', color: '#000000' }}><strong>Shuffle Answers:</strong> {shuffleAnswers ? 'Yes' : 'No'}</p>
              {passingScore && <p style={{ marginTop: '8px', color: '#000000' }}><strong>Passing Score:</strong> {passingScore}%</p>}
            </div>
            <button onClick={() => setExamStarted(true)} style={{ padding: '12px 24px', backgroundColor: '#00b000', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Start Exam</button>
          </div>
        </div>
      </div>
    );
  }

  // Submitted screen
  if (submitted) {
    const { earnedPoints, totalPoints: totalPointsSum } = calculateScore();
    const hasWrittenQuestions = groups.some(g => g.questions.some(q => q.type === 'WRITTEN'));
    const percentage = totalPointsSum > 0 ? Math.round((earnedPoints / totalPointsSum) * 100) : 0;
    const passingScore = (examData as Exam).conditions?.passingScore;
    const passed = passingScore ? percentage >= passingScore : undefined;
    
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '500px', width: '100%' }}>
          <h1 style={{ fontWeight: 'bold', marginBottom: '16px', color: '#000000' }}>Exam Submitted</h1>
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ marginBottom: '8px', color: '#000000' }}><strong>Completed:</strong> {answeredCount} / {totalQuestions} questions</p>
          </div>
          {!hasWrittenQuestions && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: passed ? '#e8f5e9' : '#ffebee', borderRadius: '8px' }}>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#000000', marginBottom: '8px' }}>Score: {earnedPoints} / {totalPointsSum} ({percentage}%)</p>
              {passingScore && <p style={{ color: passed ? '#2e7d32' : '#c62828' }}>{passed ? '✓ You passed!' : '✗ You did not pass this exam.'}</p>}
            </div>
          )}
          {hasWrittenQuestions && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
              <p style={{ color: '#000000', marginBottom: '8px' }}>Your exam has been submitted. Written responses will be reviewed by your instructor.</p>
            </div>
          )}
          <p style={{ marginBottom: '24px', color: '#000000' }}>Your device has been unlocked and you may exit.</p>
          <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#000000' }}>Reminders:</h3>
          <ul style={{ marginBottom: '32px', paddingLeft: '20px', color: '#000000' }}>
            <li>Do not distract candidates still testing.</li>
            <li>Maintain integrity of the test at all times.</li>
            <li>You may not return to this exam.</li>
            {hasWrittenQuestions && <li>Your written responses will be reviewed manually.</li>}
          </ul>
          <button onClick={onComplete} style={{ padding: '10px 20px', backgroundColor: '#00b000', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Exit</button>
        </div>
      </div>
    );
  }

  if (groups.length === 0 || !currentGroup || !currentQuestion) {
    return (
      <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#ffffff', minHeight: '100vh', color: '#000000' }}>
        <div style={{ backgroundColor: '#00b000', padding: '12px 24px' }}>
          <div style={{ fontSize: '20px', color: '#ffffff' }}>
            <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ color: '#c62828', marginBottom: '16px' }}>No Questions</h1>
            <p style={{ marginBottom: '24px', color: '#000000' }}>This exam has no questions. Please add questions to the exam first.</p>
            <button onClick={onComplete} style={{ padding: '10px 20px', backgroundColor: '#00b000', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Main exam UI
  const minTimeRemaining = getElapsedTimeDisplay();
  const minTimeMet = isMinimumTimeMet();

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#ffffff', minHeight: '100vh', color: '#000000' }}>
      {/* Top bar - green */}
      <div style={{ backgroundColor: '#00b000', padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '20px', color: '#ffffff' }}>
            <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
          </div>
            <div style={{ fontSize: isWarning ? '20px' : '18px', fontWeight: 'bold', color: isWarning ? '#ff0000' : '#ffffff' }}>
              {getTimeDisplay()}
            </div>
          </div>
        </div>

      {/* Main content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '16px', fontSize: '12px', color: '#666666' }}>
          {currentPathDisplay}
        </div>
        
        {/* Progress */}
        <div style={{ marginBottom: '16px', fontSize: '12px', color: '#666666' }}>
          {currentGroupProgress} • {currentQuestion?.points} pts
        </div>
        
        {/* Question text */}
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'Roboto, sans-serif', marginBottom: '24px', lineHeight: '1.4', color: '#000000' }}>
          {currentQuestion.text}
        </h2>

        {/* MCQ Options */}
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
                        handleAnswerSelect(idx);
                      }
                    }}
                    style={{ marginRight: '12px', marginTop: '2px', width: '18px', height: '18px', accentColor: '#00b000', cursor: 'pointer' }}
                  />
                  <label htmlFor={`opt_${idx}`} style={{ fontSize: '16px', cursor: 'pointer', color: '#000000' }}>
                    <strong style={{ color: isFixed ? '#00b000' : '#000000' }}>{letter}.</strong> {opt}
                    {isFixed && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#00b000' }}>(fixed)</span>}
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
                  onChange={() => handleAnswerSelect(idx)}
                  style={{ marginRight: '12px', width: '18px', height: '18px', accentColor: '#00b000', cursor: 'pointer' }}
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

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          <button
            onClick={handlePreviousQuestion}
            disabled={currentGroupIndex === 0 && currentQuestionIndex === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: (currentGroupIndex === 0 && currentQuestionIndex === 0) ? '#ccc' : '#00b000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: (currentGroupIndex === 0 && currentQuestionIndex === 0) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              fontFamily: 'Roboto, sans-serif'
            }}
          >
            ← Previous
          </button>
          <button
            onClick={handleNextQuestion}
            style={{
              padding: '10px 20px',
              backgroundColor: '#00b000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              fontFamily: 'Roboto, sans-serif'
            }}
          >
            {nextButtonText}
          </button>
        </div>
        
        {/* Submission notices */}
        {currentSubmitControl.mode === 'auto-only' && (
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#ff9800' }}>
            ⏱️ This section will auto-advance when the timer expires.
            {isLastQuestion && ' The exam will submit automatically.'}
          </div>
        )}
        
        {currentSubmitControl.mode === 'after-time' && !minTimeMet && currentMinMinutes > 0 && (
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#ff9800' }}>
            ⏱️ Minimum time required: {Math.ceil((currentMinMinutes * 60 - ((Date.now() - (groupStartTime || Date.now())) / 1000)) / 60)} minute(s) remaining before you can finish this section.
          </div>
        )}
        
        {currentSubmitControl.mode === 'after-time' && minTimeMet && (
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#4caf50' }}>
            ✓ Minimum time requirement met. You may now finish this section.
          </div>
        )}
      </div>
    </div>
  );
}