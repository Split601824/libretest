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

interface PastExam {
  id: string;
  title: string;
  subject: string;
  score: number;
  maxScore: number;
  date: string;
  status: 'marked' | 'unmarked';
}

interface Settings {
  language: string;
  timeFormat: string;
  dateFormat: string;
  darkMode: boolean;
}

interface PlayerHomeProps {
  onStartExam: (examId: string, examData?: any) => void;
  onRegistryCode: (code: string) => void;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    home: 'Home',
    past: 'Past',
    results: 'Results',
    settings: 'Settings',
    welcome: 'Welcome to LibreTest Player',
    openPlatform: 'An open testing platform.',
    takeExamsHere: 'Take your exams here, or import one.',
    enterCode: 'Enter Exam Code',
    importJSON: 'Import Exam (JSON)',
    digitizePDF: 'Digitize Exam (PDF)',
    advice: 'Advice',
    tip1: 'Eliminate answers that are obviously wrong.',
    tip2: 'You can save your exam anytime with Ctrl + S.',
    tip3: 'Watch the clock. Do not spend too much time on an item.',
    tip4: 'For free-response questions, plan your response first.',
    moreTests: 'More Tests →',
    showLess: 'Show Less',
    attemptRemaining: 'attempt(s) remaining',
    start: 'Start →',
    notOpen: 'Not Open',
    marked: 'Marked',
    unmarked: 'Unmarked',
    pastExams: 'Past Exams',
    noPastExams: 'No past exams yet. Complete an exam to see it here.',
    settingsTitle: 'Settings',
    language: 'Language',
    timeFormatLabel: 'Time Format',
    dateFormatLabel: 'Date Format',
    darkModeLabel: 'Dark Mode',
    comingSoon: 'Coming soon (white only for now)',
    date: 'Date',
    exam: 'Exam',
    status: 'Status',
    view: 'View'
  },
  es: {
    home: 'Inicio',
    past: 'Pasado',
    results: 'Resultados',
    settings: 'Configuración',
    welcome: 'Bienvenido a LibreTest Player',
    openPlatform: 'Una plataforma de evaluación abierta.',
    takeExamsHere: 'Toma tus exámenes aquí o importa uno.',
    enterCode: 'Ingresar Código de Examen',
    importJSON: 'Importar Examen (JSON)',
    digitizePDF: 'Digitalizar Examen (PDF)',
    advice: 'Consejos',
    tip1: 'Elimina respuestas que son obviamente incorrectas.',
    tip2: 'Puedes guardar tu examen en cualquier momento con Ctrl + S.',
    tip3: 'Mira el reloj. No pases demasiado tiempo en una pregunta.',
    tip4: 'Para respuestas de desarrollo libre, planifica tu respuesta primero.',
    moreTests: 'Más Exámenes →',
    showLess: 'Mostrar Menos',
    attemptRemaining: 'intento(s) restante(s)',
    start: 'Iniciar →',
    notOpen: 'No Disponible',
    marked: 'Calificado',
    unmarked: 'Sin Calificar',
    pastExams: 'Exámenes Anteriores',
    noPastExams: 'No hay exámenes anteriores. Completa un examen para verlo aquí.',
    settingsTitle: 'Configuración',
    language: 'Idioma',
    timeFormatLabel: 'Formato de Hora',
    dateFormatLabel: 'Formato de Fecha',
    darkModeLabel: 'Modo Oscuro',
    comingSoon: 'Próximamente (solo blanco por ahora)',
    date: 'Fecha',
    exam: 'Examen',
    status: 'Estado',
    view: 'Ver'
  }
};

export function PlayerHome({ onStartExam, onRegistryCode }: PlayerHomeProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'past' | 'results' | 'settings'>('home');
  const [showRegistryModal, setShowRegistryModal] = useState(false);
  const [showDigitizeModal, setShowDigitizeModal] = useState(false);
  const [registryCodeInput, setRegistryCodeInput] = useState('');
  const [importedExams, setImportedExams] = useState<ExamCard[]>([]);
  const [now, setNow] = useState(new Date());
  const [showAllTests, setShowAllTests] = useState(false);
  const [pastExams, setPastExams] = useState<PastExam[]>([]);
  const [settings, setSettings] = useState<Settings>({
    language: 'en',
    timeFormat: '24',
    dateFormat: 'MM/DD/YYYY',
    darkMode: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load settings and past exams from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('libretest_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    const stored = localStorage.getItem('pastExams');
    if (stored) {
      setPastExams(JSON.parse(stored));
    }
  }, []);

  const t = translations[settings.language] || translations.en;

  const getFormattedDate = () => {
    const date = now;
    switch (settings.dateFormat) {
      case 'MM/DD/YYYY':
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      case 'DD/MM/YYYY':
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      case 'YYYY-MM-DD':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      default:
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }
  };

  const getFormattedTime = () => {
    if (settings.timeFormat === '12') {
      return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('libretest_settings', JSON.stringify(newSettings));
  };

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
            <button onClick={() => setActiveTab('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: activeTab === 'home' ? 700 : 400, color: 'white' }}>{t.home}</button>
            <button onClick={() => setActiveTab('past')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: activeTab === 'past' ? 700 : 400, color: 'white' }}>{t.past}</button>
            <button onClick={() => setActiveTab('results')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: activeTab === 'results' ? 700 : 400, color: 'white' }}>{t.results}</button>
            <button onClick={() => setActiveTab('settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: activeTab === 'settings' ? 700 : 400, color: 'white' }}>{t.settings}</button>
          </div>
          <div style={{ fontSize: '14px', color: 'white' }}>
            {getFormattedDate()} | {getFormattedTime()} | 🔋 {batteryPlaceholder}
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
                      <span style={{ fontSize: '12px' }}>{exam.attemptsRemaining} {t.attemptRemaining}</span>
                      <button onClick={() => open && handleLocalStartExam(exam)} disabled={!open} style={{ padding: '8px 16px', backgroundColor: open ? '#00b000' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: open ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                        {open ? t.start : t.notOpen}
                      </button>
                    </div>
                  </div>
                );
              })}

              {hasMoreTests && !showAllTests && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button onClick={() => setShowAllTests(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00b000', fontSize: '14px' }}>
                    {t.moreTests}
                  </button>
                </div>
              )}

              {showAllTests && allExams.length > 2 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button onClick={() => setShowAllTests(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00b000', fontSize: '14px' }}>
                    {t.showLess}
                  </button>
                </div>
              )}
            </div>

            {/* Right side - Welcome and actions */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontFamily: 'Roboto', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#000' }}>{t.welcome}</h1>
                <p style={{ color: '#666' }}>{t.openPlatform}</p>
                <p style={{ color: '#666' }}>{t.takeExamsHere}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                <button onClick={() => setShowRegistryModal(true)} style={{ padding: '12px 16px', backgroundColor: '#00b000', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                  {t.enterCode}
                </button>
                <button onClick={() => fileInputRef.current?.click()} style={{ padding: '12px 16px', backgroundColor: '#00b000', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                  {t.importJSON}
                </button>
                <button onClick={() => setShowDigitizeModal(true)} style={{ padding: '12px 16px', backgroundColor: '#00b000', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                  {t.digitizePDF}
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSONFile} />
              <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleDigitizePDFFile} />

              <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '8px', borderLeft: `4px solid #00b000` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>{t.advice}</h3>
                <ol style={{ margin: 0, paddingLeft: '20px', color: '#555', fontSize: '13px', lineHeight: '1.6' }}>
                  <li>{t.tip1}</li>
                  <li>{t.tip2}</li>
                  <li>{t.tip3}</li>
                  <li>{t.tip4}</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'past' && (
          <div>
            {pastExams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                {t.noPastExams}
              </div>
            ) : (
              <>
                <h2 style={{ marginBottom: '20px' }}>{t.pastExams}</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>{t.date}</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>{t.exam}</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>{t.status}</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastExams.map((exam) => (
                      <tr key={exam.id}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{new Date(exam.date).toLocaleDateString()}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>{exam.title}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                          {exam.status === 'marked' ? (
                            <span style={{ backgroundColor: '#00b000', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{t.marked}</span>
                          ) : (
                            <span style={{ color: '#666' }}>{t.unmarked}</span>
                          )}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                          <button style={{ padding: '4px 12px', cursor: 'pointer' }}>{t.view}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {activeTab === 'results' && <div>{t.results} will appear here.</div>}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Roboto', color: '#000', }}>{t.settingsTitle}</h2>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t.language}</label>
              <select 
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                style={{ padding: '8px', width: '200px' }}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t.timeFormatLabel}</label>
              <select 
                value={settings.timeFormat}
                onChange={(e) => updateSetting('timeFormat', e.target.value)}
                style={{ padding: '8px', width: '200px' }}
              >
                <option value="12">12-hour</option>
                <option value="24">24-hour</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t.dateFormatLabel}</label>
              <select 
                value={settings.dateFormat}
                onChange={(e) => updateSetting('dateFormat', e.target.value)}
                style={{ padding: '8px', width: '200px' }}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={settings.darkMode}
                  onChange={(e) => updateSetting('darkMode', e.target.checked)}
                />
                <span>{t.darkModeLabel} ({t.comingSoon})</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Registry Code Modal */}
      {showRegistryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', minWidth: '300px' }}>
            <h3 style={{ marginBottom: '16px' }}>{t.enterCode}</h3>
            <input type="text" value={registryCodeInput} onChange={(e) => setRegistryCodeInput(e.target.value.toUpperCase())} placeholder="XXX-XXX-XXX" style={{ width: '100%', padding: '8px', marginBottom: '16px', fontFamily: 'monospace' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRegistryModal(false)} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRegistrySubmit} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#00b000', color: 'white', border: 'none', borderRadius: '4px' }}>{t.start}</button>
            </div>
          </div>
        </div>
      )}

      {/* Digitize PDF Modal */}
      {showDigitizeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', minWidth: '300px' }}>
            <h3 style={{ marginBottom: '8px' }}>{t.digitizePDF}</h3>
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