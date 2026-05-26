import React, { useState, useEffect, useRef } from 'react';

interface ExamCard {
  id: string;
  subject: string;
  title: string;
  openDate: Date;
  closeDate: Date;
  attemptsRemaining: number;
  examData?: any;
}

interface PlayerHomeProps {
  onStartExam: (examId: string, examData?: any) => void;
  onRegistryCode: (code: string) => void;
}

export function PlayerHome({ onStartExam, onRegistryCode }: PlayerHomeProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'past' | 'results' | 'settings'>('home');
  const [showRegistryModal, setShowRegistryModal] = useState(false);
  const [showDigitizeModal, setShowDigitizeModal] = useState(false);
  const [registryCodeInput, setRegistryCodeInput] = useState('');
  const [importedExams, setImportedExams] = useState<ExamCard[]>([]);
  const [now, setNow] = useState(new Date());
  const [showAllTests, setShowAllTests] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const batteryPlaceholder = '--%';

  const placeholderExams: ExamCard[] = [
    {
      id: 'math',
      subject: 'Mathematics',
      title: 'Calculus II Final',
      openDate: new Date(2026, 4, 16, 14, 0),
      closeDate: new Date(2026, 4, 22, 0, 0),
      attemptsRemaining: 1,
    },
    {
      id: 'history',
      subject: 'History',
      title: 'AMH 1020 Unit 2 Exam',
      openDate: new Date(2026, 4, 19, 9, 30),
      closeDate: new Date(2026, 4, 26, 0, 0),
      attemptsRemaining: 1,
    },
  ];

  const allExams = [...placeholderExams, ...importedExams];
  const displayExams = showAllTests ? allExams : allExams.slice(0, 2);
  const hasMoreTests = allExams.length > 2;

  const isExamOpen = (openDate: Date, closeDate: Date) => {
    const now = new Date();
    return now >= openDate && now <= closeDate;
  };

  const handleImportJSONFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const examData = JSON.parse(e.target?.result as string);
        const newExam: ExamCard = {
          id: `imported_${Date.now()}`,
          subject: examData.title || 'Imported',
          title: examData.title || 'Imported Exam',
          openDate: new Date(),
          closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          attemptsRemaining: 1,
          examData: examData,
        };
        setImportedExams([...importedExams, newExam]);
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDigitizePDFFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    alert(`PDF digitization not yet implemented. Received: ${file.name}`);
    setShowDigitizeModal(false);
    event.target.value = '';
  };

  const handleRegistrySubmit = () => {
    if (registryCodeInput.trim()) {
      onRegistryCode(registryCodeInput);
      setShowRegistryModal(false);
      setRegistryCodeInput('');
    }
  };

  const handleLocalStartExam = (exam: ExamCard) => {
    onStartExam(exam.id, exam.examData);
  };

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
      {/* Green top bar */}
      <div style={{ backgroundColor: '#00b000', padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '20px', color: 'white' }}>
            <span style={{ fontWeight: 'bold' }}>LibreTest</span> Player
          </div>
          <div style={{ display: 'flex', gap: '48px' }}>
            <button onClick={() => setActiveTab('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: activeTab === 'home' ? 700 : 400, color: 'white' }}>Home</button>
            <button onClick={() => setActiveTab('past')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: activeTab === 'past' ? 700 : 400, color: 'white' }}>Past</button>
            <button onClick={() => setActiveTab('results')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: activeTab === 'results' ? 700 : 400, color: 'white' }}>Results</button>
            <button onClick={() => setActiveTab('settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: activeTab === 'settings' ? 700 : 400, color: 'white' }}>Settings</button>
          </div>
          <div style={{ fontSize: '14px', color: 'white' }}>
            {formattedDate} {formattedTime} {batteryPlaceholder}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {activeTab === 'home' && (
          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            {/* Left side - Exam cards */}
            <div style={{ flex: 2, minWidth: '300px' }}>
              {displayExams.map((exam) => {
                const open = isExamOpen(exam.openDate, exam.closeDate);
                return (
                  <div key={exam.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{exam.subject}</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>{exam.title}</div>
                    <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '12px 0' }} />
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Open: {exam.openDate.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                      Close: {exam.closeDate.toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px' }}>{exam.attemptsRemaining} attempt(s) remaining</span>
                      <button onClick={() => open && handleLocalStartExam(exam)} disabled={!open} style={{ padding: '8px 16px', backgroundColor: open ? '#00b000' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: open ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                        {open ? 'Start →' : 'Not Open'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {hasMoreTests && !showAllTests && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button onClick={() => setShowAllTests(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00b000', fontSize: '14px' }}>
                    More Tests →
                  </button>
                </div>
              )}

              {showAllTests && allExams.length > 2 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button onClick={() => setShowAllTests(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00b000', fontSize: '14px' }}>
                    Show Less
                  </button>
                </div>
              )}
            </div>

            {/* Right side - Welcome and actions */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontFamily: 'Roboto', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#000' }}>Welcome to LibreTest Player</h1>
                <p style={{ color: '#000' }}>An open testing platform.</p>
                <p style={{ color: '#000' }}>Take your exams here, or import one.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                <button onClick={() => setShowRegistryModal(true)} style={{ padding: '12px 16px', backgroundColor: '#00b000', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                  Enter Exam Code
                </button>
                <button onClick={() => fileInputRef.current?.click()} style={{ padding: '12px 16px', backgroundColor: '#00b000', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                  Import Exam (JSON)
                </button>
                <button onClick={() => setShowDigitizeModal(true)} style={{ padding: '12px 16px', backgroundColor: '#00b000', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                  Digitize Exam (PDF)
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSONFile} />
              <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleDigitizePDFFile} />

              <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '8px', borderLeft: `4px solid #00b000` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Advice</h3>
                <ol style={{ margin: 0, paddingLeft: '20px', color: '#555', fontSize: '13px', lineHeight: '1.6' }}>
                  <li>Eliminate answers that are obviously wrong.</li>
                  <li>You can save your exam anytime with Ctrl + S.</li>
                  <li>Watch the clock. Do not spend too much time on an item.</li>
                  <li>For free-response questions, plan your response first.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'past' && <div>Past exams will appear here.</div>}
        {activeTab === 'results' && <div>Results will appear here.</div>}
        {activeTab === 'settings' && <div>Settings will appear here.</div>}
      </div>

      {/* Registry Code Modal */}
      {showRegistryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', minWidth: '300px' }}>
            <h3 style={{ marginBottom: '16px' }}>Enter Exam Code</h3>
            <input type="text" value={registryCodeInput} onChange={(e) => setRegistryCodeInput(e.target.value.toUpperCase())} placeholder="XXX-XXX-XXX" style={{ width: '100%', padding: '8px', marginBottom: '16px', fontFamily: 'monospace' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRegistryModal(false)} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRegistrySubmit} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#00b000', color: 'white', border: 'none', borderRadius: '4px' }}>Start</button>
            </div>
          </div>
        </div>
      )}

      {/* Digitize PDF Modal */}
      {showDigitizeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', minWidth: '300px' }}>
            <h3 style={{ marginBottom: '8px' }}>Digitize Exam (PDF)</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>Upload a PDF to convert to a digital test.</p>
            <input type="file" accept=".pdf" onChange={handleDigitizePDFFile} style={{ width: '100%', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDigitizeModal(false)} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}