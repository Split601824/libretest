import React, { useState, useEffect } from 'react';

interface ExamCard {
  id: string;
  subject: string;
  title: string;
}

type QuestionType = 'MCQ' | 'WRITTEN';

interface WrittenResponseLimits {
  mode: 'characters' | 'words' | 'both';
  min?: number;
  max?: number;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  tags: string[];
  // MCQ fields
  correctOptions?: string[];
  incorrectOptions?: string[];
  // Written Response fields
  limits?: WrittenResponseLimits;
}

interface QuestionBank {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  createdAt: number;
}

const placeholderExams: ExamCard[] = [
  { id: '1', subject: 'Mathematics', title: 'Calculus II Final' },
  { id: '2', subject: 'Science', title: 'Intro to Physics Final' },
  { id: '3', subject: 'Advanced Mathematics', title: 'A-Level Further Maths' },
  { id: '4', subject: 'Science', title: 'AP Chemistry Practice' },
  { id: '5', subject: 'Computer Science', title: 'AP Computer Science A' },
];

const placeholderBanks: QuestionBank[] = [
  {
    id: 'bank1',
    name: 'MAC 2312 – Calculus II',
    description: 'Integration techniques, series, polar coordinates',
    questions: [
      { 
        id: 'q1', 
        type: 'MCQ', 
        text: '∫ x² dx from 0 to 3 = ?', 
        correctOptions: ['9'], 
        incorrectOptions: ['3', '6', '12'],
        points: 2, 
        tags: ['integration'] 
      },
      { 
        id: 'q2', 
        type: 'WRITTEN', 
        text: 'Explain the comparison test for series convergence. Provide an example.', 
        points: 5, 
        tags: ['series'],
        limits: { mode: 'both', min: 100, max: 500 }
      },
    ],
    createdAt: Date.now(),
  },
  {
    id: 'bank2',
    name: 'AMH 1020 – US History',
    description: 'Reconstruction to present',
    questions: [
      { 
        id: 'q3', 
        type: 'MCQ', 
        text: 'The 19th Amendment granted voting rights to whom?', 
        correctOptions: ['Women'], 
        incorrectOptions: ['African American men', 'Native Americans', 'All citizens over 18'],
        points: 1, 
        tags: ['amendments'] 
      },
    ],
    createdAt: Date.now(),
  },
  {
    id: 'bank3',
    name: 'AP Chemistry Practice',
    description: 'Thermodynamics, kinetics, equilibrium',
    questions: [
      { 
        id: 'q4', 
        type: 'MCQ', 
        text: 'Which of the following is a strong acid?', 
        correctOptions: ['HCl'], 
        incorrectOptions: ['CH₃COOH', 'H₂CO₃', 'NH₃'],
        points: 1, 
        tags: ['acids', 'bases'] 
      },
      {
        id: 'q5',
        type: 'WRITTEN',
        text: 'Describe the relationship between Gibbs free energy and reaction spontaneity.',
        points: 4,
        tags: ['thermodynamics'],
        limits: { mode: 'characters', min: 200, max: 1000 }
      }
    ],
    createdAt: Date.now(),
  },
  {
    id: 'bank4',
    name: 'AP CSA Practice',
    description: 'Java programming fundamentals',
    questions: [],
    createdAt: Date.now(),
  },
];

const placeholderStandaloneQuestions: Question[] = [
  {
    id: 'standalone1',
    type: 'MCQ',
    text: 'What is the capital of France?',
    correctOptions: ['Paris'],
    incorrectOptions: ['London', 'Berlin', 'Madrid'],
    points: 1,
    tags: ['geography', 'easy']
  },
  {
    id: 'standalone2',
    type: 'WRITTEN',
    text: 'Explain the theory of evolution by natural selection.',
    points: 10,
    tags: ['biology', 'evolution'],
    limits: { mode: 'words', min: 200, max: 500 }
  }
];

const accentColor = '#00c462';
const deleteColor = '#cc0000';

export function StudioHome() {
  const [activeTab, setActiveTab] = useState<'home' | 'admin' | 'questions' | 'exams' | 'scoring' | 'settings'>('home');
  const [questionsSubTab, setQuestionsSubTab] = useState<'banks' | 'standalone'>('banks');
  const [now, setNow] = useState(new Date());
  const [showAll, setShowAll] = useState(false);
  
  const [banks, setBanks] = useState<QuestionBank[]>(placeholderBanks);
  const [standaloneQuestions, setStandaloneQuestions] = useState<Question[]>(placeholderStandaloneQuestions);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{ source: 'bank' | 'standalone'; bankId?: string; question: Question | null } | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>('MCQ');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const batteryPlaceholder = '--%';

  const displayExams = showAll ? placeholderExams : placeholderExams.slice(0, 4);

  const getTabStyle = (tabName: 'home' | 'admin' | 'questions' | 'exams' | 'scoring' | 'settings') => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: 'Roboto, sans-serif',
    fontWeight: activeTab === tabName ? 700 : 400,
    color: 'white'
  });

  const selectedBank = banks.find(b => b.id === selectedBankId);
  
  const filteredBankQuestions = selectedBank?.questions.filter(q => {
    const matchesSearch = searchQuery === '' || q.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = tagFilter === '' || q.tags.some(t => t.toLowerCase().includes(tagFilter.toLowerCase()));
    return matchesSearch && matchesTag;
  }) || [];

  const filteredStandaloneQuestions = standaloneQuestions.filter(q => {
    const matchesSearch = searchQuery === '' || q.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = tagFilter === '' || q.tags.some(t => t.toLowerCase().includes(tagFilter.toLowerCase()));
    return matchesSearch && matchesTag;
  });

  const handleCreateBank = (name: string, description: string) => {
    const newBank: QuestionBank = {
      id: Date.now().toString(),
      name,
      description,
      questions: [],
      createdAt: Date.now(),
    };
    setBanks([...banks, newBank]);
    setShowBankDialog(false);
  };

  const handleUpdateBank = (id: string, name: string, description: string) => {
    setBanks(banks.map(b => b.id === id ? { ...b, name, description } : b));
    setShowBankDialog(false);
    setEditingBank(null);
  };

  const handleDeleteBank = (id: string) => {
    if (confirm('Delete this bank and all its questions?')) {
      setBanks(banks.filter(b => b.id !== id));
      if (selectedBankId === id) setSelectedBankId(null);
    }
  };

  const handleSaveQuestion = (
    source: 'bank' | 'standalone', 
    bankId: string | undefined, 
    question: Omit<Question, 'id'>
  ) => {
    if (source === 'standalone') {
      if (editingQuestion?.question) {
        setStandaloneQuestions(standaloneQuestions.map(q => 
          q.id === editingQuestion.question!.id ? { ...question, id: q.id } : q
        ));
      } else {
        const newQuestion: Question = { ...question, id: Date.now().toString() };
        setStandaloneQuestions([...standaloneQuestions, newQuestion]);
      }
    } else {
      if (!bankId) return;
      if (editingQuestion?.question) {
        setBanks(banks.map(b => 
          b.id === bankId 
            ? { ...b, questions: b.questions.map(q => q.id === editingQuestion.question!.id ? { ...question, id: q.id } : q) }
            : b
        ));
      } else {
        const newQuestion: Question = { ...question, id: Date.now().toString() };
        setBanks(banks.map(b => 
          b.id === bankId 
            ? { ...b, questions: [...b.questions, newQuestion] }
            : b
        ));
      }
    }
    setShowQuestionDialog(false);
    setEditingQuestion(null);
    setQuestionType('MCQ');
  };

  const handleDeleteStandaloneQuestion = (questionId: string) => {
    if (confirm('Delete this standalone question?')) {
      setStandaloneQuestions(standaloneQuestions.filter(q => q.id !== questionId));
    }
  };

  const handleDeleteBankQuestion = (bankId: string, questionId: string) => {
    if (confirm('Delete this question?')) {
      setBanks(banks.map(b => 
        b.id === bankId 
          ? { ...b, questions: b.questions.filter(q => q.id !== questionId) }
          : b
      ));
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    return type === 'MCQ' ? 'MCQ' : 'Written';
  };

  const renderQuestionItem = (question: Question, source: 'bank' | 'standalone', bankId?: string) => (
    <div key={question.id} style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '16px', fontFamily: 'Roboto, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: accentColor, background: '#e8f5e9', padding: '2px 8px', borderRadius: '12px', fontFamily: 'Roboto, sans-serif' }}>
              {getQuestionTypeLabel(question.type)}
            </span>
            <span style={{ fontSize: '12px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>{question.points} pts</span>
            {question.tags.map(tag => (
              <span key={tag} style={{ fontSize: '11px', background: '#f0f0f0', padding: '2px 8px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }} onClick={() => setTagFilter(tag)}>
                #{tag}
              </span>
            ))}
          </div>
          <div style={{ fontSize: '14px', lineHeight: 1.4, color: 'black', fontFamily: 'Roboto, sans-serif', marginBottom: '8px' }}>{question.text}</div>
          
          {question.type === 'MCQ' && (
            <>
              <div style={{ fontSize: '12px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>
                <span style={{ color: accentColor }}>✓ Correct:</span> {question.correctOptions?.join(', ')}
              </div>
              <div style={{ fontSize: '12px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>
                <span style={{ color: '#999' }}>✗ Incorrect:</span> {question.incorrectOptions?.join(', ')}
              </div>
            </>
          )}
          
          {question.type === 'WRITTEN' && question.limits && (
            <div style={{ fontSize: '12px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>
              {question.limits.mode === 'characters' && `Character limit: ${question.limits.min || 'no min'} - ${question.limits.max || 'no max'}`}
              {question.limits.mode === 'words' && `Word limit: ${question.limits.min || 'no min'} - ${question.limits.max || 'no max'}`}
              {question.limits.mode === 'both' && `Char limit: ${question.limits.min || 'no min'} - ${question.limits.max || 'no max'} | Word limit: ${question.limits.min ? Math.floor(question.limits.min / 5) : 'no min'} - ${question.limits.max ? Math.floor(question.limits.max / 5) : 'no max'} (approx)`}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { 
            setEditingQuestion({ source, bankId, question }); 
            setQuestionType(question.type); 
            setShowQuestionDialog(true); 
          }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontFamily: 'Roboto, sans-serif' }}>✎</button>
          <button onClick={() => {
            if (source === 'standalone') {
              handleDeleteStandaloneQuestion(question.id);
            } else if (bankId) {
              handleDeleteBankQuestion(bankId, question.id);
            }
          }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontFamily: 'Roboto, sans-serif' }}>🗑</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
      {/* Top bar */}
      <div style={{ backgroundColor: accentColor, padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '20px', color: 'white', fontFamily: 'Roboto, sans-serif' }}>
            <span style={{ fontWeight: 'bold', fontFamily: 'Roboto, sans-serif' }}>LibreTest</span> Studio
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <button onClick={() => { setActiveTab('home'); setSelectedBankId(null); }} style={getTabStyle('home')}>Home</button>
            <button onClick={() => setActiveTab('admin')} style={getTabStyle('admin')}>Admin</button>
            <button onClick={() => { setActiveTab('questions'); setSelectedBankId(null); }} style={getTabStyle('questions')}>Questions</button>
            <button onClick={() => setActiveTab('exams')} style={getTabStyle('exams')}>Exams</button>
            <button onClick={() => setActiveTab('scoring')} style={getTabStyle('scoring')}>Scoring</button>
            <button onClick={() => setActiveTab('settings')} style={getTabStyle('settings')}>Settings</button>
          </div>
          <div style={{ fontSize: '14px', color: 'white', fontFamily: 'Roboto, sans-serif' }}>
            {formattedDate} | {formattedTime} | 🔋 {batteryPlaceholder}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Roboto, sans-serif' }}>
        {activeTab === 'home' && (
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '300px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: 'black', fontFamily: 'Roboto, sans-serif' }}>Recent Exams</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {displayExams.map((exam) => (
                  <div key={exam.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', fontFamily: 'Roboto, sans-serif' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontFamily: 'Roboto, sans-serif' }}>{exam.subject}</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'black', fontFamily: 'Roboto, sans-serif' }}>{exam.title}</div>
                    <button style={{ padding: '6px 12px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Roboto, sans-serif' }}>
                      Go →
                    </button>
                  </div>
                ))}
              </div>
              {placeholderExams.length > 4 && (
                <button onClick={() => setShowAll(!showAll)} style={{ marginTop: '20px', background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontFamily: 'Roboto, sans-serif' }}>
                  {showAll ? 'Show Less' : 'More Tests →'}
                </button>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '260px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: 'black', fontFamily: 'Roboto, sans-serif' }}>Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => { setActiveTab('questions'); setShowBankDialog(true); }} style={{ padding: '10px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                  New Question Bank
                </button>
                <button onClick={() => setActiveTab('exams')} style={{ padding: '10px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                  Create New Exam
                </button>
                <button style={{ padding: '10px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                  Digitize Exam (PDF)
                </button>
                <button style={{ padding: '10px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                  Import Exam (JSON)
                </button>
              </div>
              <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f9f9f9', borderLeft: `3px solid ${accentColor}`, fontFamily: 'Roboto, sans-serif' }}>
                <p style={{ fontSize: '13px', color: '#555', fontFamily: 'Roboto, sans-serif' }}>💡 Create a question bank first to reuse questions across multiple exams.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>
            <h2 style={{ color: 'black', fontFamily: 'Roboto, sans-serif' }}>Admin</h2>
            <p style={{ fontFamily: 'Roboto, sans-serif' }}>User management, class rosters, and permissions will appear here.</p>
          </div>
        )}

        {activeTab === 'questions' && (
          <div style={{ fontFamily: 'Roboto, sans-serif' }}>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
              <button
                onClick={() => { setQuestionsSubTab('banks'); setSelectedBankId(null); setSearchQuery(''); setTagFilter(''); }}
                style={{
                  padding: '10px 20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: questionsSubTab === 'banks' ? 700 : 400,
                  color: questionsSubTab === 'banks' ? accentColor : '#666',
                  borderBottom: questionsSubTab === 'banks' ? `2px solid ${accentColor}` : 'none'
                }}
              >
                Question Banks
              </button>
              <button
                onClick={() => { setQuestionsSubTab('standalone'); setSelectedBankId(null); setSearchQuery(''); setTagFilter(''); }}
                style={{
                  padding: '10px 20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: questionsSubTab === 'standalone' ? 700 : 400,
                  color: questionsSubTab === 'standalone' ? accentColor : '#666',
                  borderBottom: questionsSubTab === 'standalone' ? `2px solid ${accentColor}` : 'none'
                }}
              >
                Standalone Questions
              </button>
            </div>

            {/* Question Banks View */}
            {questionsSubTab === 'banks' && (
              <div>
                {!selectedBank ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'black', fontFamily: 'Roboto, sans-serif' }}>Question Banks</h2>
                      <button onClick={() => { setEditingBank(null); setShowBankDialog(true); }} style={{ padding: '8px 16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                        + New Bank
                      </button>
                    </div>

                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }}>
                      {banks.map((bank, idx) => (
                        <div key={bank.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          borderBottom: idx === banks.length - 1 ? 'none' : '1px solid #e0e0e0',
                          height: '48px'
                        }}>
                          <button 
                            onClick={() => handleDeleteBank(bank.id)}
                            style={{ 
                              background: deleteColor,
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              width: '80px',
                              height: '48px',
                              fontSize: '13px',
                              fontWeight: 500,
                              fontFamily: 'Roboto, sans-serif'
                            }}
                          >
                            Delete
                          </button>
                          <div style={{ flex: 1, paddingLeft: '20px', fontSize: '15px', fontWeight: 500, color: 'black', fontFamily: 'Roboto, sans-serif' }}>
                            {bank.name}
                          </div>
                          <button 
                            onClick={() => setSelectedBankId(bank.id)}
                            style={{ 
                              background: 'none',
                              border: 'none',
                              color: accentColor,
                              cursor: 'pointer',
                              padding: '0 20px',
                              fontSize: '13px',
                              fontWeight: 500,
                              height: '48px',
                              fontFamily: 'Roboto, sans-serif'
                            }}
                          >
                            Configure →
                          </button>
                        </div>
                      ))}
                    </div>

                    {banks.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', fontFamily: 'Roboto, sans-serif' }}>
                        <p style={{ fontFamily: 'Roboto, sans-serif' }}>No question banks yet. Click "+ New Bank" to get started.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                      <button onClick={() => setSelectedBankId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontFamily: 'Roboto, sans-serif' }}>
                        ← Back
                      </button>
                      <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'black', fontFamily: 'Roboto, sans-serif' }}>{selectedBank.name}</h2>
                      <button onClick={() => { setEditingQuestion({ source: 'bank', bankId: selectedBank.id, question: null }); setQuestionType('MCQ'); setShowQuestionDialog(true); }} style={{ padding: '8px 16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                        + Add Question
                      </button>
                    </div>

                    {selectedBank.description && (
                      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px', fontFamily: 'Roboto, sans-serif' }}>{selectedBank.description}</p>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                      <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }} />
                      <input type="text" placeholder="Filter by tag" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }} />
                      {(searchQuery || tagFilter) && <button onClick={() => { setSearchQuery(''); setTagFilter(''); }} style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>Clear</button>}
                    </div>

                    {filteredBankQuestions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', border: '1px dashed #ddd', fontFamily: 'Roboto, sans-serif' }}>
                        <p style={{ fontFamily: 'Roboto, sans-serif' }}>{selectedBank.questions.length === 0 ? 'No questions yet. Click "+ Add Question" to get started.' : 'No matching questions.'}</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredBankQuestions.map(question => renderQuestionItem(question, 'bank', selectedBank.id))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Standalone Questions View */}
            {questionsSubTab === 'standalone' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'black', fontFamily: 'Roboto, sans-serif' }}>Standalone Questions</h2>
                  <button onClick={() => { setEditingQuestion({ source: 'standalone', question: null }); setQuestionType('MCQ'); setShowQuestionDialog(true); }} style={{ padding: '8px 16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                    + New Question
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }} />
                  <input type="text" placeholder="Filter by tag" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }} />
                  {(searchQuery || tagFilter) && <button onClick={() => { setSearchQuery(''); setTagFilter(''); }} style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>Clear</button>}
                </div>

                {filteredStandaloneQuestions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', border: '1px dashed #ddd', fontFamily: 'Roboto, sans-serif' }}>
                    <p style={{ fontFamily: 'Roboto, sans-serif' }}>{standaloneQuestions.length === 0 ? 'No standalone questions yet. Click "+ New Question" to get started.' : 'No matching questions.'}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredStandaloneQuestions.map(question => renderQuestionItem(question, 'standalone'))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'exams' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>
            <h2 style={{ color: 'black', fontFamily: 'Roboto, sans-serif' }}>Exams</h2>
            <p style={{ fontFamily: 'Roboto, sans-serif' }}>Exam creation and management will appear here.</p>
          </div>
        )}

        {activeTab === 'scoring' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>
            <h2 style={{ color: 'black', fontFamily: 'Roboto, sans-serif' }}>Scoring</h2>
            <p style={{ fontFamily: 'Roboto, sans-serif' }}>Creation of scoring systems will appear here.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>
            <h2 style={{ color: 'black', fontFamily: 'Roboto, sans-serif' }}>Settings</h2>
            <p style={{ fontFamily: 'Roboto, sans-serif' }}>Studio settings will appear here.</p>
          </div>
        )}
      </div>

      {/* Bank Dialog */}
      {showBankDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: '450px', fontFamily: 'Roboto, sans-serif' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: 'black', fontFamily: 'Roboto, sans-serif' }}>{editingBank ? 'Edit Bank' : 'New Question Bank'}</h3>
            <input id="bankName" type="text" placeholder="Bank name" defaultValue={editingBank?.name || ''} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '12px', fontFamily: 'Roboto, sans-serif' }} />
            <textarea id="bankDescription" placeholder="Description (optional)" defaultValue={editingBank?.description || ''} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px', marginBottom: '20px', fontFamily: 'Roboto, sans-serif' }} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowBankDialog(false); setEditingBank(null); }} style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>Cancel</button>
              <button onClick={() => {
                const name = (document.getElementById('bankName') as HTMLInputElement).value;
                const desc = (document.getElementById('bankDescription') as HTMLTextAreaElement).value;
                if (name.trim()) editingBank ? handleUpdateBank(editingBank.id, name.trim(), desc) : handleCreateBank(name.trim(), desc);
              }} style={{ padding: '8px 16px', background: accentColor, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Question Dialog */}
      {showQuestionDialog && editingQuestion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto', fontFamily: 'Roboto, sans-serif' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: 'black', fontFamily: 'Roboto, sans-serif' }}>{editingQuestion.question ? 'Edit Question' : 'New Question'}</h3>
            
            {/* Question Type Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: 'black', fontFamily: 'Roboto, sans-serif' }}>Question Type *</label>
              <select 
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }}
              >
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="WRITTEN">Written Response</option>
              </select>
            </div>

            {/* Question Text */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: 'black', fontFamily: 'Roboto, sans-serif' }}>Question Text *</label>
              <textarea id="questionText" defaultValue={editingQuestion.question?.text || ''} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px', fontFamily: 'Roboto, sans-serif' }} />
            </div>

            {/* Points */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: 'black', fontFamily: 'Roboto, sans-serif' }}>Points *</label>
              <input id="questionPoints" type="number" defaultValue={editingQuestion.question?.points || 1} style={{ width: '100px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }} />
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: 'black', fontFamily: 'Roboto, sans-serif' }}>Tags (comma separated)</label>
              <input id="questionTags" defaultValue={editingQuestion.question?.tags.join(', ') || ''} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }} placeholder="algebra, easy, derivatives" />
            </div>

            {/* MCQ Fields */}
            {questionType === 'MCQ' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: accentColor, fontFamily: 'Roboto, sans-serif' }}>✓ Correct Options</label>
                  <div id="correctOptionsContainer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(editingQuestion.question?.type === 'MCQ' && editingQuestion.question.correctOptions?.length ? editingQuestion.question.correctOptions : ['']).map((opt, idx) => (
                      <input key={idx} type="text" className="correct-option" defaultValue={opt} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }} placeholder="Correct option text" />
                    ))}
                  </div>
                  <button type="button" onClick={() => {
                    const container = document.getElementById('correctOptionsContainer');
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'correct-option';
                    input.placeholder = 'Correct option text';
                    input.style.cssText = 'width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-family: Roboto, sans-serif;';
                    container?.appendChild(input);
                  }} style={{ marginTop: '8px', background: 'none', border: 'none', color: accentColor, cursor: 'pointer', fontSize: '13px', fontFamily: 'Roboto, sans-serif' }}>+ Add correct option</button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#999', fontFamily: 'Roboto, sans-serif' }}>✗ Incorrect Options</label>
                  <div id="incorrectOptionsContainer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(editingQuestion.question?.type === 'MCQ' && editingQuestion.question.incorrectOptions?.length ? editingQuestion.question.incorrectOptions : ['', '']).map((opt, idx) => (
                      <input key={idx} type="text" className="incorrect-option" defaultValue={opt} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }} placeholder="Incorrect option text" />
                    ))}
                  </div>
                  <button type="button" onClick={() => {
                    const container = document.getElementById('incorrectOptionsContainer');
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'incorrect-option';
                    input.placeholder = 'Incorrect option text';
                    input.style.cssText = 'width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-family: Roboto, sans-serif;';
                    container?.appendChild(input);
                  }} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '13px', fontFamily: 'Roboto, sans-serif' }}>+ Add incorrect option</button>
                </div>
              </>
            )}

            {/* Written Response Fields */}
            {questionType === 'WRITTEN' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: 'black', fontFamily: 'Roboto, sans-serif' }}>Response Limits</label>
                
                <div style={{ marginBottom: '12px' }}>
                  <select id="limitMode" defaultValue={editingQuestion.question?.type === 'WRITTEN' ? editingQuestion.question.limits?.mode || 'characters' : 'characters'} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }}>
                    <option value="characters">Character limit</option>
                    <option value="words">Word limit</option>
                    <option value="both">Both character + word limits</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>Minimum</label>
                    <input id="limitMin" type="number" defaultValue={editingQuestion.question?.type === 'WRITTEN' ? editingQuestion.question.limits?.min || '' : ''} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }} placeholder="Optional" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>Maximum</label>
                    <input id="limitMax" type="number" defaultValue={editingQuestion.question?.type === 'WRITTEN' ? editingQuestion.question.limits?.max || '' : ''} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }} placeholder="Optional" />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowQuestionDialog(false); setEditingQuestion(null); setQuestionType('MCQ'); }} style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>Cancel</button>
              <button onClick={() => {
                const text = (document.getElementById('questionText') as HTMLTextAreaElement).value;
                const points = parseInt((document.getElementById('questionPoints') as HTMLInputElement).value);
                const tags = (document.getElementById('questionTags') as HTMLInputElement).value.split(',').map(t => t.trim()).filter(t => t);
                
                if (!text) {
                  alert('Please enter question text.');
                  return;
                }

                if (questionType === 'MCQ') {
                  const correctOptions = Array.from(document.querySelectorAll('.correct-option')).map(input => (input as HTMLInputElement).value.trim()).filter(v => v);
                  const incorrectOptions = Array.from(document.querySelectorAll('.incorrect-option')).map(input => (input as HTMLInputElement).value.trim()).filter(v => v);
                  
                  if (correctOptions.length === 0) {
                    alert('Please add at least one correct option.');
                    return;
                  }
                  if (incorrectOptions.length === 0) {
                    alert('Please add at least one incorrect option.');
                    return;
                  }
                  
                  handleSaveQuestion(editingQuestion.source, editingQuestion.bankId, { 
                    type: 'MCQ', 
                    text, 
                    points: points || 1, 
                    tags, 
                    correctOptions, 
                    incorrectOptions 
                  });
                } else {
                  const mode = (document.getElementById('limitMode') as HTMLSelectElement).value as 'characters' | 'words' | 'both';
                  const minVal = (document.getElementById('limitMin') as HTMLInputElement).value;
                  const maxVal = (document.getElementById('limitMax') as HTMLInputElement).value;
                  const limits: WrittenResponseLimits = { mode };
                  if (minVal) limits.min = parseInt(minVal);
                  if (maxVal) limits.max = parseInt(maxVal);
                  
                  handleSaveQuestion(editingQuestion.source, editingQuestion.bankId, { 
                    type: 'WRITTEN', 
                    text, 
                    points: points || 1, 
                    tags, 
                    limits 
                  });
                }
              }} style={{ padding: '8px 16px', background: accentColor, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>Save Question</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}