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
  correctOptions?: string[];
  incorrectOptions?: string[];
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
      { 
        id: 'q3', 
        type: 'MCQ', 
        text: 'What is the derivative of ln(x)?', 
        correctOptions: ['1/x'], 
        incorrectOptions: ['x', 'ln(x)', 'e^x'],
        points: 2, 
        tags: ['derivatives', 'logarithms'] 
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
        id: 'q4', 
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
        id: 'q5', 
        type: 'MCQ', 
        text: 'Which of the following is a strong acid?', 
        correctOptions: ['HCl'], 
        incorrectOptions: ['CH₃COOH', 'H₂CO₃', 'NH₃'],
        points: 1, 
        tags: ['acids', 'bases'] 
      },
      {
        id: 'q6',
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

type ViewMode = 'bank-list' | 'bank-editor' | 'standalone-editor';

export function StudioHome() {
  const [activeTab, setActiveTab] = useState<'home' | 'admin' | 'questions' | 'exams' | 'scoring' | 'settings'>('questions');
  const [now, setNow] = useState(new Date());
  const [showAll, setShowAll] = useState(false);
  
  const [banks, setBanks] = useState<QuestionBank[]>(placeholderBanks);
  const [standaloneQuestions, setStandaloneQuestions] = useState<Question[]>(placeholderStandaloneQuestions);
  
  const [viewMode, setViewMode] = useState<ViewMode>('bank-list');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isNewQuestion, setIsNewQuestion] = useState(false);

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
  const currentQuestions = viewMode === 'standalone-editor' ? standaloneQuestions : (selectedBank?.questions || []);
  const selectedQuestion = currentQuestions.find(q => q.id === selectedQuestionId);
  
  const filteredQuestions = currentQuestions.filter(q => {
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
      if (selectedBankId === id) {
        setViewMode('bank-list');
        setSelectedBankId(null);
        setSelectedQuestionId(null);
      }
    }
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;
    
    if (viewMode === 'standalone-editor') {
      if (isNewQuestion) {
        const newQuestion: Question = { ...editingQuestion, id: Date.now().toString() };
        setStandaloneQuestions([...standaloneQuestions, newQuestion]);
        setSelectedQuestionId(newQuestion.id);
      } else {
        setStandaloneQuestions(standaloneQuestions.map(q => 
          q.id === editingQuestion.id ? editingQuestion : q
        ));
      }
    } else {
      if (!selectedBankId) return;
      if (isNewQuestion) {
        const newQuestion: Question = { ...editingQuestion, id: Date.now().toString() };
        setBanks(banks.map(b => 
          b.id === selectedBankId 
            ? { ...b, questions: [...b.questions, newQuestion] }
            : b
        ));
        setSelectedQuestionId(newQuestion.id);
      } else {
        setBanks(banks.map(b => 
          b.id === selectedBankId 
            ? { ...b, questions: b.questions.map(q => q.id === editingQuestion.id ? editingQuestion : q) }
            : b
        ));
      }
    }
    setEditingQuestion(null);
    setIsNewQuestion(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (confirm('Delete this question?')) {
      if (viewMode === 'standalone-editor') {
        setStandaloneQuestions(standaloneQuestions.filter(q => q.id !== questionId));
        if (selectedQuestionId === questionId) {
          setSelectedQuestionId(null);
          setEditingQuestion(null);
        }
      } else {
        if (!selectedBankId) return;
        setBanks(banks.map(b => 
          b.id === selectedBankId 
            ? { ...b, questions: b.questions.filter(q => q.id !== questionId) }
            : b
        ));
        if (selectedQuestionId === questionId) {
          setSelectedQuestionId(null);
          setEditingQuestion(null);
        }
      }
    }
  };

  const handleSelectQuestion = (question: Question) => {
    setSelectedQuestionId(question.id);
    setEditingQuestion({ ...question });
    setIsNewQuestion(false);
  };

  const handleNewQuestion = () => {
    setSelectedQuestionId(null);
    setEditingQuestion({
      id: 'temp',
      type: 'MCQ',
      text: '',
      points: 1,
      tags: [],
      correctOptions: [''],
      incorrectOptions: ['', ''],
    });
    setIsNewQuestion(true);
  };

  const handleCancelEdit = () => {
    if (selectedQuestion) {
      setEditingQuestion({ ...selectedQuestion });
    } else {
      setEditingQuestion(null);
      setIsNewQuestion(false);
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    return type === 'MCQ' ? 'MCQ' : 'Written';
  };

  const getQuestionPreview = (question: Question) => {
    const text = question.text.length > 60 ? question.text.substring(0, 60) + '...' : question.text;
    return `${getQuestionTypeLabel(question.type)}: ${text}`;
  };

  const handleBackToBanks = () => {
    setViewMode('bank-list');
    setSelectedBankId(null);
    setSelectedQuestionId(null);
    setEditingQuestion(null);
    setSearchQuery('');
    setTagFilter('');
  };

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
      {/* Top bar */}
      <div style={{ backgroundColor: accentColor, padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '20px', color: 'white', fontFamily: 'Roboto, sans-serif' }}>
            <span style={{ fontWeight: 'bold', fontFamily: 'Roboto, sans-serif' }}>LibreTest</span> Studio
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <button onClick={() => { setActiveTab('home'); setViewMode('bank-list'); }} style={getTabStyle('home')}>Home</button>
            <button onClick={() => setActiveTab('admin')} style={getTabStyle('admin')}>Admin</button>
            <button onClick={() => { setActiveTab('questions'); setViewMode('bank-list'); }} style={getTabStyle('questions')}>Questions</button>
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
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Roboto, sans-serif' }}>
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
            {viewMode === 'bank-list' ? (
              /* Bank List View */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'black', fontFamily: 'Roboto, sans-serif' }}>Question Banks</h2>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => { setViewMode('standalone-editor'); setSelectedQuestionId(standaloneQuestions[0]?.id || null); if (standaloneQuestions[0]) setEditingQuestion({ ...standaloneQuestions[0] }); }} style={{ padding: '8px 16px', backgroundColor: 'white', color: accentColor, border: `1px solid ${accentColor}`, borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                      Standalone Questions →
                    </button>
                    <button onClick={() => { setEditingBank(null); setShowBankDialog(true); }} style={{ padding: '8px 16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                      + New Bank
                    </button>
                  </div>
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
                        onClick={() => { setViewMode('bank-editor'); setSelectedBankId(bank.id); setSelectedQuestionId(bank.questions[0]?.id || null); if (bank.questions[0]) setEditingQuestion({ ...bank.questions[0] }); }}
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
              /* Split Pane Editor (for both Bank and Standalone) */
              <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
                {/* Left Panel - Question List */}
                <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #e0e0e0', paddingRight: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <button onClick={handleBackToBanks} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
                      ← Back to Banks
                    </button>
                    <button onClick={handleNewQuestion} style={{ padding: '6px 12px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>
                      + New
                    </button>
                  </div>
                  
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'black', fontFamily: 'Roboto, sans-serif', marginBottom: '12px' }}>
                    {viewMode === 'standalone-editor' ? 'Standalone Questions' : selectedBank?.name}
                  </h3>
                  
                  {/* Search/Filter */}
                  <div style={{ marginBottom: '16px' }}>
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', fontSize: '13px', marginBottom: '8px' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Filter by tag" 
                      value={tagFilter} 
                      onChange={(e) => setTagFilter(e.target.value)} 
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }} 
                    />
                  </div>
                  
                  {/* Question List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '500px', overflowY: 'auto' }}>
                    {filteredQuestions.map((question, idx) => (
                      <div 
                        key={question.id}
                        onClick={() => handleSelectQuestion(question)}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: selectedQuestionId === question.id ? '#e8f5e9' : 'transparent',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: selectedQuestionId === question.id ? `1px solid ${accentColor}` : '1px solid transparent',
                          fontFamily: 'Roboto, sans-serif'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: selectedQuestionId === question.id ? accentColor : '#666', fontFamily: 'Roboto, sans-serif' }}>
                            #{idx + 1}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(question.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '12px', fontFamily: 'Roboto, sans-serif' }}
                          >
                            🗑
                          </button>
                        </div>
                        <div style={{ fontSize: '13px', color: 'black', marginTop: '4px', fontFamily: 'Roboto, sans-serif' }}>
                          {getQuestionPreview(question)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontFamily: 'Roboto, sans-serif' }}>
                          {question.points} pts | {question.tags.slice(0, 2).join(', ')}{question.tags.length > 2 ? '...' : ''}
                        </div>
                      </div>
                    ))}
                    {filteredQuestions.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>
                        No questions found
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Question Editor */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingQuestion ? (
                    <div style={{ padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px', minHeight: '600px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'black', fontFamily: 'Roboto, sans-serif' }}>
                          {isNewQuestion ? 'New Question' : `Edit Question #${filteredQuestions.findIndex(q => q.id === editingQuestion.id) + 1}`}
                        </h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button onClick={handleCancelEdit} style={{ padding: '6px 16px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                            Cancel
                          </button>
                          <button onClick={handleSaveQuestion} style={{ padding: '6px 16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                            Save
                          </button>
                        </div>
                      </div>

                      {/* Question Type */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: 'black', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>Type</label>
                        <select 
                          value={editingQuestion.type}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as QuestionType })}
                          style={{ width: '200px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }}
                        >
                          <option value="MCQ">Multiple Choice (MCQ)</option>
                          <option value="WRITTEN">Written Response</option>
                        </select>
                      </div>

                      {/* Question Text */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: 'black', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>Question Text</label>
                        <textarea 
                          value={editingQuestion.text}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px', fontFamily: 'Roboto, sans-serif' }}
                        />
                      </div>

                      {/* Points */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: 'black', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>Points</label>
                        <input 
                          type="number" 
                          value={editingQuestion.points}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, points: parseInt(e.target.value) || 0 })}
                          style={{ width: '100px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }}
                        />
                      </div>

                      {/* Tags */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: 'black', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>Tags (comma separated)</label>
                        <input 
                          type="text" 
                          value={editingQuestion.tags.join(', ')}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }}
                          placeholder="algebra, easy, derivatives"
                        />
                      </div>

                      {/* MCQ Fields */}
                      {editingQuestion.type === 'MCQ' && (
                        <>
                          <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: accentColor, fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>✓ Correct Options</label>
                            {editingQuestion.correctOptions?.map((opt, idx) => (
                              <input 
                                key={idx}
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...(editingQuestion.correctOptions || [])];
                                  newOpts[idx] = e.target.value;
                                  setEditingQuestion({ ...editingQuestion, correctOptions: newOpts });
                                }}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px', fontFamily: 'Roboto, sans-serif' }}
                                placeholder="Correct option text"
                              />
                            ))}
                            <button 
                              onClick={() => setEditingQuestion({ ...editingQuestion, correctOptions: [...(editingQuestion.correctOptions || []), ''] })}
                              style={{ marginTop: '4px', background: 'none', border: 'none', color: accentColor, cursor: 'pointer', fontSize: '13px', fontFamily: 'Roboto, sans-serif' }}
                            >
                              + Add correct option
                            </button>
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#999', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>✗ Incorrect Options</label>
                            {editingQuestion.incorrectOptions?.map((opt, idx) => (
                              <input 
                                key={idx}
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...(editingQuestion.incorrectOptions || [])];
                                  newOpts[idx] = e.target.value;
                                  setEditingQuestion({ ...editingQuestion, incorrectOptions: newOpts });
                                }}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px', fontFamily: 'Roboto, sans-serif' }}
                                placeholder="Incorrect option text"
                              />
                            ))}
                            <button 
                              onClick={() => setEditingQuestion({ ...editingQuestion, incorrectOptions: [...(editingQuestion.incorrectOptions || []), ''] })}
                              style={{ marginTop: '4px', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '13px', fontFamily: 'Roboto, sans-serif' }}
                            >
                              + Add incorrect option
                            </button>
                          </div>
                        </>
                      )}

                      {/* Written Response Fields */}
                      {editingQuestion.type === 'WRITTEN' && (
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: 'black', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>Response Limits</label>
                          
                          <select 
                            value={editingQuestion.limits?.mode || 'characters'}
                            onChange={(e) => setEditingQuestion({ 
                              ...editingQuestion, 
                              limits: { ...editingQuestion.limits, mode: e.target.value as 'characters' | 'words' | 'both' }
                            })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '12px', fontFamily: 'Roboto, sans-serif' }}
                          >
                            <option value="characters">Character limit</option>
                            <option value="words">Word limit</option>
                            <option value="both">Both character + word limits</option>
                          </select>

                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>Minimum</label>
                              <input 
                                type="number"
                                value={editingQuestion.limits?.min || ''}
                                onChange={(e) => setEditingQuestion({ 
                                  ...editingQuestion, 
                                  limits: { ...editingQuestion.limits, min: e.target.value ? parseInt(e.target.value) : undefined }
                                })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }}
                                placeholder="Optional"
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#666', fontFamily: 'Roboto, sans-serif' }}>Maximum</label>
                              <input 
                                type="number"
                                value={editingQuestion.limits?.max || ''}
                                onChange={(e) => setEditingQuestion({ 
                                  ...editingQuestion, 
                                  limits: { ...editingQuestion.limits, max: e.target.value ? parseInt(e.target.value) : undefined }
                                })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif' }}
                                placeholder="Optional"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#999', fontFamily: 'Roboto, sans-serif' }}>
                      {currentQuestions.length === 0 ? (
                        <div style={{ textAlign: 'center' }}>
                          <p>No questions in {viewMode === 'standalone-editor' ? 'standalone' : 'this bank'}.</p>
                          <button onClick={handleNewQuestion} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                            Create First Question
                          </button>
                        </div>
                      ) : (
                        <p>Select a question from the left to edit, or create a new one.</p>
                      )}
                    </div>
                  )}
                </div>
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
    </div>
  );
}