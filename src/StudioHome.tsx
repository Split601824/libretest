import React, { useState, useEffect } from 'react';

interface ExamCard {
  id: string;
  subject: string;
  title: string;
}

const placeholderExams: ExamCard[] = [
  { id: '1', subject: 'Mathematics', title: 'Calculus II Final' },
  { id: '2', subject: 'Science', title: 'Intro to Physics Final' },
  { id: '3', subject: 'Advanced Mathematics', title: 'A-Level Further Maths' },
  { id: '4', subject: 'Science', title: 'AP Chemistry Practice' },
  { id: '5', subject: 'Computer Science', title: 'AP Computer Science A' },
];

const accentColor = '#00c462';

export function StudioHome() {
  const [activeTab, setActiveTab] = useState<'home' | 'admin' | 'questions' | 'exams' | 'settings'>('home');
  const [now, setNow] = useState(new Date());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const batteryPlaceholder = '--%';

  const displayExams = showAll ? placeholderExams : placeholderExams.slice(0, 4);

  const getTabStyle = (tabName: 'home' | 'admin' | 'questions' | 'exams' | 'settings') => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: 'Roboto, sans-serif',
    fontWeight: activeTab === tabName ? 700 : 400,
    color: 'white'
  });

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: 'white', minHeight: '100vh', color: 'black' }}>
      {/* Green top bar */}
      <div style={{ backgroundColor: accentColor, padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '20px', color: 'white', fontFamily: 'Roboto, sans-serif' }}>
            <span style={{ fontWeight: 'bold', fontFamily: 'Roboto, sans-serif' }}>LibreTest</span> Studio
          </div>
          <div style={{ display: 'flex', gap: '48px' }}>
            <button onClick={() => setActiveTab('home')} style={getTabStyle('home')}>Home</button>
            <button onClick={() => setActiveTab('admin')} style={getTabStyle('admin')}>Admin</button>
            <button onClick={() => setActiveTab('questions')} style={getTabStyle('questions')}>Questions</button>
            <button onClick={() => setActiveTab('exams')} style={getTabStyle('exams')}>Exams</button>
            <button onClick={() => setActiveTab('settings')} style={getTabStyle('settings')}>Settings</button>
          </div>
          <div style={{ fontSize: '14px', color: 'white', fontFamily: 'Roboto, sans-serif' }}>
            {formattedDate} | {formattedTime} | 🔋 {batteryPlaceholder}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {activeTab === 'home' && (
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {/* Left side - Exam cards */}
            <div style={{ flex: 2, minWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'black', fontFamily: 'Roboto, sans-serif' }}>Recent Exams</h2>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontFamily: 'Roboto, sans-serif' }}>Create New Exam</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {displayExams.map((exam) => (
                  <div key={exam.id} style={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px', 
                    padding: '20px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', fontFamily: 'Roboto, sans-serif' }}>{exam.subject}</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'black', marginBottom: '16px', fontFamily: 'Roboto, sans-serif' }}>{exam.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button style={{ 
                        padding: '8px 16px', 
                        backgroundColor: accentColor, 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontFamily: 'Roboto, sans-serif'
                      }}>
                        Go →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {placeholderExams.length > 4 && !showAll && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button onClick={() => setShowAll(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontFamily: 'Roboto, sans-serif' }}>
                    More Tests →
                  </button>
                </div>
              )}

              {showAll && placeholderExams.length > 4 && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button onClick={() => setShowAll(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontFamily: 'Roboto, sans-serif' }}>
                    Show Less
                  </button>
                </div>
              )}
            </div>

            {/* Right side - Actions */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'black', marginBottom: '16px', fontFamily: 'Roboto, sans-serif' }}>Actions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button style={{ padding: '12px 16px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: 'black', fontFamily: 'Roboto, sans-serif' }}>
                    New Question Bank
                  </button>
                  <button style={{ padding: '12px 16px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: 'black', fontFamily: 'Roboto, sans-serif' }}>
                    Create New Exam
                  </button>
                  <button style={{ padding: '12px 16px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: 'black', fontFamily: 'Roboto, sans-serif' }}>
                    Digitize Exam (PDF)
                  </button>
                  <button style={{ padding: '12px 16px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: 'black', fontFamily: 'Roboto, sans-serif' }}>
                    Import Exam (JSON)
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${accentColor}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'black', marginBottom: '8px', fontFamily: 'Roboto, sans-serif' }}>Tip</h3>
                <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.5', fontFamily: 'Roboto, sans-serif' }}>
                  Create a question bank first to reuse questions across multiple exams.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'black', marginBottom: '16px', fontFamily: 'Roboto, sans-serif' }}>Admin</h2>
            <p style={{ fontFamily: 'Roboto, sans-serif' }}>User management, class rosters, and permissions will appear here.</p>
          </div>
        )}

        {activeTab === 'questions' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'black', marginBottom: '16px', fontFamily: 'Roboto, sans-serif' }}>Questions</h2>
            <p style={{ fontFamily: 'Roboto, sans-serif' }}>Question bank management will appear here.</p>
          </div>
        )}

        {activeTab === 'exams' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'black', marginBottom: '16px', fontFamily: 'Roboto, sans-serif' }}>Exams</h2>
            <p style={{ fontFamily: 'Roboto, sans-serif' }}>Exam creation and management will appear here.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'black', marginBottom: '16px', fontFamily: 'Roboto, sans-serif' }}>Settings</h2>
            <p style={{ fontFamily: 'Roboto, sans-serif' }}>Studio settings will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}