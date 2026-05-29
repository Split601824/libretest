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
  shuffleAnswers: boolean;  // ← ONLY for answer choices
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

interface TreeNode {
  id: string;
  name: string;
  type: string;
  path: string[];
  parentId: string | null;
  questions: FlatQuestion[];
  children: TreeNode[];
  timeLimit?: TimeLimit;
  depth: number;
  firstQuestionIndex: number;
  lastQuestionIndex: number;
  answeredCount: number;
  totalQuestions: number;
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
  parentId: string | null;
  timeLimit?: TimeLimit;
  globalIndex: number;
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | number>>(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [warningThreshold] = useState(300);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [shuffledOptions, setShuffledOptions] = useState<Map<string, { options: string[]; fixedLetter?: string; fixedOption: string | null }>>(new Map());
  const [groupTimeRemaining, setGroupTimeRemaining] = useState<Map<string, number>>(new Map());

  const getAnswerKey = (groupId: string, questionId: string) => `${groupId}_${questionId}`;

  // Build the n-ary tree and flattened questions list - NO SHUFFLING OF QUESTIONS
  const { flatQuestions, totalQuestions, totalPoints, treeRoots, getNodeByQuestionIndex } = useMemo(() => {
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
        parentId: null,
        globalIndex: idx
      }));
      const totalQ = legacyQuestions.length;
      const totalPts = legacyQuestions.reduce((sum, q) => sum + q.points, 0);
      
      const legacyNode: TreeNode = {
        id: 'legacy',
        name: 'Exam',
        type: 'section',
        path: ['Exam'],
        parentId: null,
        questions: legacyQuestions,
        children: [],
        depth: 0,
        firstQuestionIndex: 0,
        lastQuestionIndex: totalQ - 1,
        answeredCount: 0,
        totalQuestions: totalQ
      };
      
      const getNode = () => legacyNode;
      
      return { 
        flatQuestions: legacyQuestions, 
        totalQuestions: totalQ, 
        totalPoints: totalPts,
        treeRoots: [legacyNode],
        getNodeByQuestionIndex: getNode
      };
    }
    
    const examWithSections = examData as Exam;
    if (!examWithSections.sections || examWithSections.sections.length === 0) {
      return { flatQuestions: [], totalQuestions: 0, totalPoints: 0, treeRoots: [], getNodeByQuestionIndex: () => null };
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
    
    // Recursive function to build tree and collect questions in order (DFS - PRESERVES EXACT JSON ORDER)
    let globalQuestionIndex = 0;
    const flatQuestionsList: FlatQuestion[] = [];
    const nodeMap = new Map<string, TreeNode>();
    let roots: TreeNode[] = [];
    
    const processGroup = (
      group: GroupNode, 
      parentId: string | null, 
      path: string[], 
      depth: number
    ): TreeNode => {
      const currentPath = [...path, group.name];
      const groupId = group.id;
      const timeLimit = getTimeLimitForGroup(groupId, group.timeLimit);
      
      // Collect questions from this group (preserving order)
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
            parentId: parentId,
            timeLimit,
            globalIndex: globalQuestionIndex++
          };
          groupQuestions.push(flatQ);
          flatQuestionsList.push(flatQ);
        }
      }
      
      // Create node
      const node: TreeNode = {
        id: groupId,
        name: group.name,
        type: group.type,
        path: currentPath,
        parentId: parentId,
        questions: groupQuestions,
        children: [],
        timeLimit,
        depth,
        firstQuestionIndex: groupQuestions.length > 0 ? groupQuestions[0].globalIndex : -1,
        lastQuestionIndex: groupQuestions.length > 0 ? groupQuestions[groupQuestions.length - 1].globalIndex : -1,
        answeredCount: 0,
        totalQuestions: groupQuestions.length
      };
      
      nodeMap.set(groupId, node);
      
      // Process children (modules, submodules, etc.) - preserving order
      for (const childGroup of group.groups) {
        const childNode = processGroup(childGroup, groupId, currentPath, depth + 1);
        node.children.push(childNode);
        // Aggregate child questions into node's range
        if (childNode.firstQuestionIndex !== -1) {
          if (node.firstQuestionIndex === -1 || childNode.firstQuestionIndex < node.firstQuestionIndex) {
            node.firstQuestionIndex = childNode.firstQuestionIndex;
          }
          if (node.lastQuestionIndex === -1 || childNode.lastQuestionIndex > node.lastQuestionIndex) {
            node.lastQuestionIndex = childNode.lastQuestionIndex;
          }
        }
        node.totalQuestions += childNode.totalQuestions;
      }
      
      return node;
    };
    
    // Process each section in EXACT order of the JSON array
    for (const section of examWithSections.sections) {
      const rootNode = processGroup(section, null, [], 0);
      roots.push(rootNode);
    }
    
    // NO SHUFFLING OF QUESTIONS - preserve exact JSON order
    // flatQuestionsList is already in correct DFS order
    
    const totalQ = flatQuestionsList.length;
    const totalPts = flatQuestionsList.reduce((sum, q) => sum + q.points, 0);
    
    const getNodeByIndex = (index: number): TreeNode | null => {
      const question = flatQuestionsList[index];
      if (!question) return null;
      return nodeMap.get(question.groupId) || null;
    };
    
    return { 
      flatQuestions: flatQuestionsList, 
      totalQuestions: totalQ, 
      totalPoints: totalPts,
      treeRoots: roots,
      getNodeByQuestionIndex: getNodeByIndex
    };
  }, [examData]);

  // Get current question and its node
  const currentQuestion = flatQuestions[currentQuestionIndex];
  const currentNode = currentQuestion ? getNodeByQuestionIndex(currentQuestionIndex) : null;

  // Shuffle MCQ options ONLY - this runs once per question and does NOT affect section order
  useEffect(() => {
    if (flatQuestions.length === 0) return;
    
    const optionsMap = new Map();
    const shouldShuffleAnswers = (examData as Exam).conditions?.shuffleAnswers ?? true;
    
    for (const q of flatQuestions) {
      if (q.type === 'MCQ') {
        const originalQ = q.originalQuestion as Question;
        if (originalQ.correctOptions && originalQ.correctOptions.length > 0 && originalQ.incorrectOptions) {
          // Only shuffle if shuffleAnswers is true
          if (shouldShuffleAnswers) {
            const shuffled = shuffleOptionsWithFixed(
              originalQ.correctOptions,
              originalQ.incorrectOptions,
              originalQ.fixedOptionIndex,
              originalQ.fixedOptionText
            );
            optionsMap.set(q.id, shuffled);
          } else {
            // No shuffle - preserve original order
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
    setShuffledOptions(optionsMap);
  }, [flatQuestions, examData]);

  // Get current time limit
  const currentTimeLimit = currentQuestion?.timeLimit || (examData as Exam).conditions?.globalTimeLimit;

  // Update answered counts in tree nodes (just for display, not stored in state)
  useEffect(() => {
    // This effect just triggers re-render when answers change
  }, [answers]);

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
        if (currentQuestion) {
          setGroupTimeRemaining(prevMap => new Map(prevMap).set(currentQuestion.groupId, prev - 1));
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, submitted, timeLeft, currentQuestion]);

  // Initialize time
  useEffect(() => {
    if (flatQuestions.length > 0 && timeLeft === null && examStarted && currentQuestion) {
      let timeLimit = currentQuestion.timeLimit;
      if (!timeLimit?.enabled) {
        const examWithConditions = examData as Exam;
        timeLimit = examWithConditions.conditions.globalTimeLimit;
      }
      const seconds = calculateTimeLimitInSeconds(timeLimit);
      if (seconds !== null && seconds > 0) {
        const savedTime = groupTimeRemaining.get(currentQuestion.groupId);
        setTimeLeft(savedTime !== undefined ? savedTime : seconds);
      } else {
        setTimeLeft(null);
      }
    }
  }, [flatQuestions, examStarted, timeLeft, currentQuestion]);

  // Update time when question changes
  useEffect(() => {
    if (!examStarted || !currentQuestion) return;
    
    let timeLimit = currentQuestion.timeLimit;
    if (!timeLimit?.enabled) {
      const examWithConditions = examData as Exam;
      timeLimit = examWithConditions.conditions.globalTimeLimit;
    }
    
    const seconds = calculateTimeLimitInSeconds(timeLimit);
    if (seconds !== null && seconds > 0) {
      const savedTime = groupTimeRemaining.get(currentQuestion.groupId);
      setTimeLeft(savedTime !== undefined ? savedTime : seconds);
    } else {
      setTimeLeft(null);
    }
  }, [currentQuestionIndex, examStarted]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 0 && !submitted && examStarted) {
      handleSubmit();
    }
  }, [timeLeft, submitted, examStarted]);

  useEffect(() => {
    setLoading(false);
  }, [flatQuestions]);

  useEffect(() => {
    if (!loading && flatQuestions.length === 0 && totalQuestions === 0) {
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
  }, [flatQuestions, totalQuestions, examData, loading]);

  const calculateScore = () => {
    let earnedPoints = 0;
    let totalPointsSum = 0;

    for (const q of flatQuestions) {
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

    return { earnedPoints, totalPoints: totalPointsSum };
  };

  const getAnsweredCount = () => {
    let count = 0;
    for (const q of flatQuestions) {
      if (answers.has(getAnswerKey(q.groupId, q.id))) {
        count++;
      }
    }
    return count;
  };

  const saveResult = () => {
    const { earnedPoints, totalPoints: totalPointsSum } = calculateScore();
    const pastExams = JSON.parse(localStorage.getItem('pastExams') || '[]');
    const hasWrittenQuestions = flatQuestions.some(q => q.type === 'WRITTEN');
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

  const handleSubmit = () => {
    saveResult();
    setSubmitted(true);
  };

  const handleAnswerSelect = (answer: string | number) => {
    if (!currentQuestion) return;
    const newAnswers = new Map(answers);
    newAnswers.set(getAnswerKey(currentQuestion.groupId, currentQuestion.id), answer);
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < flatQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleGoToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  // Recursive function to render the sidebar tree
  const renderTreeNode = (node: TreeNode, level: number = 0): JSX.Element => {
    const isActive = currentNode?.id === node.id;
    const answeredCount = node.questions.filter(q => answers.has(getAnswerKey(q.groupId, q.id))).length;
    const hasTimeLimit = node.timeLimit?.enabled && !node.timeLimit?.untimed;
    const timeLimitDisplay = hasTimeLimit ? `(${node.timeLimit?.minutes}m)` : '';
    
    return (
      <div key={node.id} style={{ marginBottom: '4px' }}>
        <div 
          onClick={() => node.firstQuestionIndex >= 0 && handleGoToQuestion(node.firstQuestionIndex)}
          style={{ 
            padding: '8px 10px', 
            paddingLeft: `${12 + level * 16}px`,
            backgroundColor: isActive ? '#e8f5e9' : 'transparent',
            borderRadius: '6px',
            cursor: node.firstQuestionIndex >= 0 ? 'pointer' : 'default',
            borderLeft: isActive ? `3px solid #00c462` : '3px solid transparent',
            opacity: node.firstQuestionIndex >= 0 ? 1 : 0.6
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: '#000000', fontSize: '13px' }}>
              {node.name} {timeLimitDisplay}
            </span>
            <span style={{ fontSize: '11px', color: '#666' }}>{answeredCount}/{node.totalQuestions}</span>
          </div>
        </div>
        {node.children.length > 0 && (
          <div style={{ marginTop: '2px' }}>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const currentPathDisplay = currentQuestion?.groupPath.join(' > ') || '';
  const selectedAnswer = currentQuestion ? answers.get(getAnswerKey(currentQuestion.groupId, currentQuestion.id)) : null;
  
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
    const shuffleAnswers = (examData as Exam).conditions?.shuffleAnswers ?? true;
    
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
              <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '8px', color: '#000000' }}><strong>Format:</strong> {totalQuestions} questions, {totalPoints} points total</p>
              <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '8px', color: '#000000' }}><strong>Global Time Limit:</strong> {globalTimeDisplay}</p>
              <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '8px', color: '#000000' }}><strong>Security Level:</strong> {securityLevel}</p>
              <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '8px', color: '#000000' }}><strong>Shuffle Answers:</strong> {shuffleAnswers ? 'Yes' : 'No'}</p>
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
    const hasWrittenQuestions = flatQuestions.some(q => q.type === 'WRITTEN');
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

  if (flatQuestions.length === 0 || !currentQuestion) {
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
        {/* Sidebar - N-ary Tree */}
        <div style={{ 
          width: showSidebar ? '300px' : '0',
          overflow: 'auto',
          transition: 'width 0.2s',
          borderRight: showSidebar ? '1px solid #e0e0e0' : 'none',
          backgroundColor: '#fafafa'
        }}>
          {showSidebar && (
            <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
              <button 
                onClick={() => setShowSidebar(false)}
                style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666' }}
              >
                ×
              </button>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#000000' }}>Exam Structure</h3>
              {treeRoots.map(root => renderTreeNode(root, 0))}
            </div>
          )}
        </div>

        {/* Question content */}
        <div style={{ flex: 1, padding: '40px 24px', maxWidth: showSidebar ? 'calc(100% - 300px)' : '100%', margin: '0 auto' }}>
          {!showSidebar && (
            <button 
              onClick={() => setShowSidebar(true)}
              style={{ marginBottom: '16px', padding: '6px 12px', backgroundColor: '#00c462', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              ☰ Show Structure
            </button>
          )}
          
          {/* Breadcrumb */}
          <div style={{ marginBottom: '16px', fontSize: '12px', color: '#666666' }}>
            {currentPathDisplay}
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#666666' }}>
                Question {currentQuestionIndex + 1} of {totalQuestions} • {currentQuestion?.points} {currentQuestion?.points === 1 ? 'point' : 'points'}
              </span>
              <span style={{ fontSize: '12px', color: '#666666' }}>
                {currentQuestion?.groupName}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', lineHeight: '1.4', color: '#000000', fontFamily: 'Roboto' }}>{currentQuestion?.text}</h2>

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
              disabled={currentQuestionIndex === 0}
              style={{
                padding: '10px 20px',
                backgroundColor: currentQuestionIndex === 0 ? '#ccc' : '#00c462',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
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
              {currentQuestionIndex < totalQuestions - 1 ? 'Next →' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}