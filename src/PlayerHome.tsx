import { useState, useRef } from 'react';

interface ExamCard {
  id: string;
  subject: string;
  title: string;
  startDate: Date;
  endDate: Date;
  attemptsRemaining: number;
  examData?: any; // Store loaded exam JSON
}

const sampleExams: ExamCard[] = [
  {
    id: '1',
    subject: 'Mathematics',
    title: 'Calculus II Final',
    startDate: new Date(2026, 4, 16, 14, 0),
    endDate: new Date(2026, 4, 22, 0, 0),
    attemptsRemaining: 1,
  },
  {
    id: '2',
    subject: 'History',
    title: 'AMH 1020 Unit 2 Exam',
    startDate: new Date(2026, 4, 19, 9, 30),
    endDate: new Date(2026, 4, 26, 0, 0),
    attemptsRemaining: 1,
  },
];

interface PlayerHomeProps {
  onStartExam: (examId: string, examData?: any) => void;
  onImportJSON: (jsonData: any) => void;
  onDigitizePDF: (file: File) => void;
  onRegistryCode: (code: string) => void;
}

export function PlayerHome({ 
  onStartExam, 
  onImportJSON, 
  onDigitizePDF, 
  onRegistryCode 
}: PlayerHomeProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'past' | 'results'>('home');
  const [registryCodeInput, setRegistryCodeInput] = useState('');
  const [showRegistryModal, setShowRegistryModal] = useState(false);
  const [showDigitizeModal, setShowDigitizeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [localExams, setLocalExams] = useState<ExamCard[]>(sampleExams);
  const currentDate = new Date();

  const isExamOpen = (startDate: Date, endDate: Date) => {
    return currentDate >= startDate && currentDate <= endDate;
  };

  const handleImportJSONFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const examData = JSON.parse(e.target?.result as string);
        // Add to local exams list
        const newExam: ExamCard = {
          id: `imported_${Date.now()}`,
          subject: examData.title || 'Imported Exam',
          title: examData.title || 'Imported Exam',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          attemptsRemaining: 1,
          examData: examData,
        };
        setLocalExams([...localExams, newExam]);
        onImportJSON(examData);
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleDigitizePDFFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onDigitizePDF(file);
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
    <div style={{ fontFamily: 'Roboto, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'normal', margin: 0 }}>LibreTest Player</h1>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button 
            onClick={() => setActiveTab('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'home' ? 'bold' : 'normal' }}
          >
            Home
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'past' ? 'bold' : 'normal' }}
          >
            Past
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'results' ? 'bold' : 'normal' }}
          >
            Results
          </button>
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          May 17 | 13:50 | 94%
        </div>
      </div>

      {/* Green bar */}
      <div style={{ height: '4px', backgroundColor: '#15EB15', marginBottom: '20px' }} />

      {activeTab === 'home' && (
        <>
          {/* Exam cards */}
          {localExams.map((exam) => {
            const open = isExamOpen(exam.startDate, exam.endDate);
            return (
              <div key={exam.id} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '16px' 
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>{exam.subject}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{exam.title}</div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {exam.startDate.toLocaleDateString()} {exam.startDate.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })} —{' '}
                  {exam.endDate.toLocaleDateString()} {exam.endDate.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                </div>
                <div style={{ fontSize: '12px', marginBottom: '12px' }}>{exam.attemptsRemaining} attempt remaining</div>
                <button 
                  onClick={() => open && handleLocalStartExam(exam)}
                  disabled={!open}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: open ? '#15EB15' : '#ccc',
                    color: 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: open ? 'pointer' : 'not-allowed'
                  }}
                >
                  {open ? 'Start →' : 'Not Open'}
                </button>
              </div>
            );
          })}

          {/* Action buttons */}
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setShowRegistryModal(true)} 
              style={{ padding: '10px 16px', cursor: 'pointer' }}
            >
              Enter Exam Registry Code
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              style={{ padding: '10px 16px', cursor: 'pointer' }}
            >
              Import Exam File (JSON)
            </button>
            <button 
              onClick={() => setShowDigitizeModal(true)} 
              style={{ padding: '10px 16px', cursor: 'pointer' }}
            >
              Digitize Exam (PDF)
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportJSONFile}
          />

          {/* More Tests link */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15EB15' }}>More Tests →</button>
          </div>
        </>
      )}

      {activeTab === 'past' && (
        <div>
          <p>Past exams will appear here.</p>
        </div>
      )}

      {activeTab === 'results' && (
        <div>
          <p>Results will appear here.</p>
        </div>
      )}

      {/* Registry Code Modal */}
      {showRegistryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', minWidth: '300px' }}>
            <h3>Enter Exam Code</h3>
            <input
              type="text"
              value={registryCodeInput}
              onChange={(e) => setRegistryCodeInput(e.target.value.toUpperCase())}
              placeholder="XXX-XXX-XXX"
              style={{ width: '100%', padding: '8px', margin: '16px 0', fontFamily: 'monospace' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRegistryModal(false)}>Cancel</button>
              <button onClick={handleRegistrySubmit}>Start</button>
            </div>
          </div>
        </div>
      )}

      {/* Digitize PDF Modal */}
      {showDigitizeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', minWidth: '300px' }}>
            <h3>Digitize Exam (PDF)</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>Upload a PDF to convert to a digital test.</p>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={handleDigitizePDFFile}
              style={{ width: '100%', margin: '16px 0' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDigitizeModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}