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

interface GroupNode {
  id: string;
  name: string;
  type: 'section' | 'module' | 'submodule';
  groups: GroupNode[];
  questions: ExamQuestion[];
  timeLimit?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
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

interface ExamQuestion {
  id: string;
  sourceType: 'bank' | 'standalone' | 'blank';
  sourceId?: string;
  question: Question;
  overridePoints?: number;
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

interface Settings {
  timeFormat: '12h' | '24h';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  language: 'en' | 'es';
}

// Spanish translations
const t = (key: string, lang: 'en' | 'es'): string => {
  const translations: Record<string, Record<'en' | 'es', string>> = {
    'studio': { en: 'Studio', es: 'Estudio' },
    'home': { en: 'Home', es: 'Inicio' },
    'admin': { en: 'Admin', es: 'Admin' },
    'questions': { en: 'Questions', es: 'Preguntas' },
    'exams': { en: 'Exams', es: 'Exámenes' },
    'scoring': { en: 'Scoring', es: 'Calificación' },
    'settings': { en: 'Settings', es: 'Configuración' },
    'new_question_bank': { en: 'New Question Bank', es: 'Nuevo Banco de Preguntas' },
    'create_new_exam': { en: 'Create New Exam', es: 'Crear Nuevo Examen' },
    'digitize_exam': { en: 'Digitize Exam (PDF)', es: 'Digitalizar Examen (PDF)' },
    'import_exam_json': { en: 'Import Exam (JSON)', es: 'Importar Examen (JSON)' },
    'tip': { en: '💡 Create a question bank first to reuse questions across multiple exams.', es: '💡 Crea un banco de preguntas primero para reutilizar preguntas en múltiples exámenes.' },
    'question_banks': { en: 'Question Banks', es: 'Bancos de Preguntas' },
    'standalone_questions': { en: 'Standalone Questions →', es: 'Preguntas Independientes →' },
    'new_bank': { en: '+ New Bank', es: '+ Nuevo Banco' },
    'delete': { en: 'Delete', es: 'Eliminar' },
    'configure': { en: 'Configure →', es: 'Configurar →' },
    'no_banks': { en: 'No question banks yet. Click "+ New Bank" to get started.', es: 'Aún no hay bancos de preguntas. Haz clic en "+ Nuevo Banco" para comenzar.' },
    'new_question': { en: 'New Question', es: 'Nueva Pregunta' },
    'edit_question': { en: 'Edit Question', es: 'Editar Pregunta' },
    'type': { en: 'Type', es: 'Tipo' },
    'multiple_choice': { en: 'Multiple Choice (MCQ)', es: 'Opción Múltiple' },
    'written_response': { en: 'Written Response', es: 'Respuesta Escrita' },
    'question_text': { en: 'Question Text', es: 'Texto de la Pregunta' },
    'points': { en: 'Points', es: 'Puntos' },
    'tags': { en: 'Tags (comma separated)', es: 'Etiquetas (separadas por comas)' },
    'correct_options': { en: '✓ Correct Options', es: '✓ Opciones Correctas' },
    'incorrect_options': { en: '✗ Incorrect Options', es: '✗ Opciones Incorrectas' },
    'add_correct': { en: '+ Add correct option', es: '+ Agregar opción correcta' },
    'add_incorrect': { en: '+ Add incorrect option', es: '+ Agregar opción incorrecta' },
    'response_limits': { en: 'Response Limits', es: 'Límites de Respuesta' },
    'character_limit': { en: 'Character limit', es: 'Límite de caracteres' },
    'word_limit': { en: 'Word limit', es: 'Límite de palabras' },
    'both_limits': { en: 'Both character + word limits', es: 'Ambos límites' },
    'minimum': { en: 'Minimum', es: 'Mínimo' },
    'maximum': { en: 'Maximum', es: 'Máximo' },
    'cancel': { en: 'Cancel', es: 'Cancelar' },
    'save': { en: 'Save', es: 'Guardar' },
    'back_to_banks': { en: '← Back to Banks', es: '← Volver a Bancos' },
    'search': { en: 'Search...', es: 'Buscar...' },
    'filter_by_tag': { en: 'Filter by tag', es: 'Filtrar por etiqueta' },
    'clear': { en: 'Clear', es: 'Limpiar' },
    'no_questions_found': { en: 'No questions found', es: 'No se encontraron preguntas' },
    'no_questions_in_bank': { en: 'No questions in', es: 'No hay preguntas en' },
    'this_bank': { en: 'this bank', es: 'este banco' },
    'standalone': { en: 'standalone', es: 'independientes' },
    'create_first_question': { en: 'Create First Question', es: 'Crear Primera Pregunta' },
    'select_question_to_edit': { en: 'Select a question from the left to edit, or create a new one.', es: 'Selecciona una pregunta de la izquierda para editar, o crea una nueva.' },
    'exams_list': { en: 'Exams', es: 'Exámenes' },
    'new_exam': { en: '+ New', es: '+ Nuevo' },
    'no_exams': { en: 'No exams yet. Click "+ New" to create one.', es: 'Aún no hay exámenes. Haz clic en "+ Nuevo" para crear uno.' },
    'metadata': { en: 'metadata', es: 'metadatos' },
    'groups': { en: 'groups', es: 'grupos' },
    'conditions': { en: 'conditions', es: 'condiciones' },
    'security': { en: 'security', es: 'seguridad' },
    'export': { en: 'export', es: 'exportar' },
    'description': { en: 'Description', es: 'Descripción' },
    'subject_course': { en: 'Subject / Course Code', es: 'Materia / Código del Curso' },
    'new_section': { en: '+ New Section', es: '+ Nueva Sección' },
    'new_module': { en: '+ New Module', es: '+ Nuevo Módulo' },
    'new_submodule': { en: '+ New Submodule', es: '+ Nuevo Submódulo' },
    'import_bank': { en: 'Import Bank', es: 'Importar Banco' },
    'add_blank': { en: '+ Add Blank', es: '+ Agregar en Blanco' },
    'no_sections': { en: 'No sections yet. Click "New Section" to get started.', es: 'Aún no hay secciones. Haz clic en "Nueva Sección" para comenzar.' },
    'select_bank_to_import': { en: 'Select a bank to import ALL its questions into this group.', es: 'Selecciona un banco para importar TODAS sus preguntas a este grupo.' },
    'import_to_group': { en: 'Import to Group', es: 'Importar al Grupo' },
    'time_limit': { en: 'Time Limit', es: 'Límite de Tiempo' },
    'days': { en: 'days', es: 'días' },
    'hours': { en: 'hours', es: 'horas' },
    'minutes': { en: 'minutes', es: 'minutos' },
    'seconds': { en: 'seconds', es: 'segundos' },
    'no_limit': { en: 'No limit', es: 'Sin límite' },
    'passing_score': { en: 'Passing Score (%)', es: 'Puntaje Aprobatorio (%)' },
    'optional': { en: 'Optional', es: 'Opcional' },
    'question_order': { en: 'Question Order (within groups)', es: 'Orden de Preguntas (dentro de grupos)' },
    'manual_order': { en: 'Manual (instructor order within groups)', es: 'Manual (orden del instructor dentro de grupos)' },
    'auto_order': { en: 'Auto-generate (randomize per student within groups)', es: 'Auto-generar (aleatorio por estudiante dentro de grupos)' },
    'security_level': { en: 'Security Level (CBT)', es: 'Nivel de Seguridad (CBT)' },
    'export_json': { en: 'Export this exam to JSON format for use with LibreTest Player.', es: 'Exporta este examen a formato JSON para usar con LibreTest Player.' },
    'download_json': { en: 'Download JSON', es: 'Descargar JSON' },
    'preview': { en: 'Preview', es: 'Vista Previa' },
    'select_exam': { en: 'Select an exam from the left to edit, or create a new one.', es: 'Selecciona un examen de la izquierda para editar, o crea uno nuevo.' },
    'create_new_exam_button': { en: 'Create New Exam', es: 'Crear Nuevo Examen' },
    'questions_count': { en: 'questions', es: 'preguntas' },
    'auto_order_badge': { en: 'Auto-order', es: 'Auto-orden' },
    'manual_badge': { en: 'Manual', es: 'Manual' },
    'sections_count': { en: 'sections', es: 'secciones' },
    'from_bank': { en: 'from bank', es: 'del banco' },
    'from_standalone': { en: 'standalone', es: 'independiente' },
    'pts': { en: 'pts', es: 'pts' },
    'settings_title': { en: 'Settings', es: 'Configuración' },
    'time_format': { en: 'Time Format', es: 'Formato de Hora' },
    'format_12h': { en: '12-hour (12:30 PM)', es: '12 horas (12:30 PM)' },
    'format_24h': { en: '24-hour (14:30)', es: '24 horas (14:30)' },
    'date_format': { en: 'Date Format', es: 'Formato de Fecha' },
    'language_settings': { en: 'Language', es: 'Idioma' },
    'english': { en: 'English', es: 'Inglés' },
    'spanish': { en: 'Español', es: 'Español' },
    'settings_saved': { en: 'Settings are saved locally and persist between sessions.', es: 'La configuración se guarda localmente y persiste entre sesiones.' },
    'security_open': { en: 'Nothing is blocked. Completely trust-based. Great for open-book tests.', es: 'Nada está bloqueado. Completamente basado en confianza. Ideal para exámenes a libro abierto.' },
    'security_protected': { en: 'Web browser is restricted to approved materials (if allowed).', es: 'El navegador web está restringido a materiales aprobados (si se permite).' },
    'security_secure': { en: 'Internet access is disabled. Web browsers prohibited.', es: 'El acceso a Internet está deshabilitado. Navegadores web prohibidos.' },
    'security_very_secure': { en: 'Internet + background services disabled. At Ring 1.', es: 'Internet + servicios en segundo plano deshabilitados. En Ring 1.' },
    'security_lockdown': { en: 'Kernel-level lockdown. Internet access is disabled. At Ring 0.', es: 'Bloqueo a nivel de kernel. Acceso a Internet deshabilitado. En Ring 0.' },
  };
  
  return translations[key]?.[lang] || key;
};

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

const placeholderExamsData: Exam[] = [
  {
    id: 'exam1',
    title: 'Calculus II Final',
    description: 'Final exam covering integration techniques and series',
    subject: 'Mathematics',
    conditions: {
      securityLevel: 'Open',
      timeLimit: { days: 0, hours: 1, minutes: 30, seconds: 0 },
      passingScore: 70,
      questionOrderMode: 'auto'
    },
    sections: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'exam2',
    title: 'AP Chemistry Practice',
    description: 'Practice exam for AP Chemistry',
    subject: 'Science',
    conditions: {
      securityLevel: 'Open',
      timeLimit: { days: 0, hours: 1, minutes: 0, seconds: 0 },
      passingScore: 60,
      questionOrderMode: 'manual'
    },
    sections: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const accentColor = '#00c462';
const deleteColor = '#cc0000';

const securityLevelColors = {
  Open: 'white',
  Protected: '#00c462',
  Secure: '#ffc107',
  'Very Secure': '#ff9800',
  Lockdown: '#f44336'
};

const securityLevelDescriptions = {
  Open: 'security_open',
  Protected: 'security_protected',
  Secure: 'security_secure',
  'Very Secure': 'security_very_secure',
  Lockdown: 'security_lockdown'
};

type ViewMode = 'bank-list' | 'bank-editor' | 'standalone-editor';
type ExamTab = 'metadata' | 'groups' | 'conditions' | 'security' | 'export';

export function StudioHome() {
  const [activeTab, setActiveTab] = useState<'home' | 'admin' | 'questions' | 'exams' | 'scoring' | 'settings'>('exams');
  const [now, setNow] = useState(new Date());
  const [showAll, setShowAll] = useState(false);
  
  const [banks, setBanks] = useState<QuestionBank[]>(placeholderBanks);
  const [standaloneQuestions, setStandaloneQuestions] = useState<Question[]>(placeholderStandaloneQuestions);
  const [exams, setExams] = useState<Exam[]>(placeholderExamsData);
  const [settings, setSettings] = useState<Settings>({
    timeFormat: '24h',
    dateFormat: 'MM/DD/YYYY',
    language: 'en'
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>('bank-list');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isNewQuestion, setIsNewQuestion] = useState(false);

  // Exam state
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examTab, setExamTab] = useState<ExamTab>('metadata');
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isNewExam, setIsNewExam] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedBankToImport, setSelectedBankToImport] = useState<string | null>(null);
  const [importTargetGroupId, setImportTargetGroupId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = (() => {
    const d = now;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    switch (settings.dateFormat) {
      case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
      default: return `${month}/${day}/${year}`;
    }
  })();
  
  const formattedTime = (() => {
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    if (settings.timeFormat === '12h') {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  })();
  
  const batteryPlaceholder = '--%';
  const lang = settings.language;

  const displayExams = showAll ? placeholderExams : placeholderExams.slice(0, 4);

  const getTabStyle = (tabName: 'home' | 'admin' | 'questions' | 'exams' | 'scoring' | 'settings') => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: 'Roboto, sans-serif',
    fontWeight: activeTab === tabName ? 700 : 400,
    color: '#ffffff'
  });

  const selectedBank = banks.find(b => b.id === selectedBankId);
  const currentQuestions = viewMode === 'standalone-editor' ? standaloneQuestions : (selectedBank?.questions || []);
  const selectedQuestion = currentQuestions.find(q => q.id === selectedQuestionId);
  const selectedExam = exams.find(e => e.id === selectedExamId);
  
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

  // Exam handlers
  const handleCreateExam = () => {
    const newExam: Exam = {
      id: Date.now().toString(),
      title: 'New Exam',
      description: '',
      subject: '',
      conditions: {
        securityLevel: 'Open',
        timeLimit: { days: 0, hours: 0, minutes: 0, seconds: 0 },
        passingScore: undefined,
        questionOrderMode: 'auto'
      },
      sections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setExams([...exams, newExam]);
    setSelectedExamId(newExam.id);
    setEditingExam({ ...newExam });
    setIsNewExam(true);
    setExamTab('metadata');
  };

  const handleUpdateExam = () => {
    if (!editingExam) return;
    setExams(exams.map(e => e.id === editingExam.id ? { ...editingExam, updatedAt: Date.now() } : e));
    if (isNewExam) setIsNewExam(false);
  };

  const handleDeleteExam = (id: string) => {
    if (confirm('Delete this exam?')) {
      setExams(exams.filter(e => e.id !== id));
      if (selectedExamId === id) {
        setSelectedExamId(null);
        setEditingExam(null);
      }
    }
  };

  const handleSelectExam = (exam: Exam) => {
    setSelectedExamId(exam.id);
    setEditingExam({ ...exam });
    setIsNewExam(false);
    setExamTab('metadata');
  };

  // Section operations
  const handleAddSection = () => {
    if (!editingExam) return;
    const newSection: GroupNode = {
      id: Date.now().toString(),
      name: lang === 'en' ? `Section ${editingExam.sections.length + 1}` : `Sección ${editingExam.sections.length + 1}`,
      type: 'section',
      groups: [],
      questions: [],
    };
    setEditingExam({
      ...editingExam,
      sections: [...editingExam.sections, newSection]
    });
    setExpandedGroups(prev => new Set(prev).add(newSection.id));
  };

  // Module operations (add module to a section)
  const handleAddModule = (parentId: string) => {
    if (!editingExam) return;
    const addModuleToParent = (groups: GroupNode[]): GroupNode[] => {
      return groups.map(group => {
        if (group.id === parentId) {
          const newModule: GroupNode = {
            id: Date.now().toString(),
            name: lang === 'en' ? `Module ${group.groups.length + 1}` : `Módulo ${group.groups.length + 1}`,
            type: 'module',
            groups: [],
            questions: [],
          };
          return { ...group, groups: [...group.groups, newModule] };
        }
        if (group.groups.length > 0) {
          return { ...group, groups: addModuleToParent(group.groups) };
        }
        return group;
      });
    };
    setEditingExam({
      ...editingExam,
      sections: addModuleToParent(editingExam.sections)
    });
  };

  // Submodule operations
  const handleAddSubmodule = (parentId: string) => {
    if (!editingExam) return;
    const addSubmoduleToParent = (groups: GroupNode[]): GroupNode[] => {
      return groups.map(group => {
        if (group.id === parentId) {
          const newSubmodule: GroupNode = {
            id: Date.now().toString(),
            name: lang === 'en' ? `Submodule ${group.groups.length + 1}` : `Submódulo ${group.groups.length + 1}`,
            type: 'submodule',
            groups: [],
            questions: [],
          };
          return { ...group, groups: [...group.groups, newSubmodule] };
        }
        if (group.groups.length > 0) {
          return { ...group, groups: addSubmoduleToParent(group.groups) };
        }
        return group;
      });
    };
    setEditingExam({
      ...editingExam,
      sections: addSubmoduleToParent(editingExam.sections)
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!editingExam) return;
    const deleteFromGroups = (groups: GroupNode[]): GroupNode[] => {
      return groups.filter(group => {
        if (group.id === groupId) return false;
        if (group.groups.length > 0) {
          group.groups = deleteFromGroups(group.groups);
        }
        return true;
      });
    };
    setEditingExam({
      ...editingExam,
      sections: deleteFromGroups(editingExam.sections)
    });
  };

  const handleUpdateGroupName = (groupId: string, name: string) => {
    if (!editingExam) return;
    const updateName = (groups: GroupNode[]): GroupNode[] => {
      return groups.map(group => {
        if (group.id === groupId) {
          return { ...group, name };
        }
        if (group.groups.length > 0) {
          return { ...group, groups: updateName(group.groups) };
        }
        return group;
      });
    };
    setEditingExam({
      ...editingExam,
      sections: updateName(editingExam.sections)
    });
  };

  const handleAddQuestionToGroup = (groupId: string, question: Question, sourceType: 'bank' | 'standalone' | 'blank', sourceId?: string) => {
    if (!editingExam) return;
    const newExamQuestion: ExamQuestion = {
      id: Date.now().toString(),
      sourceType,
      sourceId,
      question: { ...question, id: Date.now().toString() },
      overridePoints: question.points,
    };
    
    const addToGroup = (groups: GroupNode[]): GroupNode[] => {
      return groups.map(group => {
        if (group.id === groupId) {
          return { ...group, questions: [...group.questions, newExamQuestion] };
        }
        if (group.groups.length > 0) {
          return { ...group, groups: addToGroup(group.groups) };
        }
        return group;
      });
    };
    setEditingExam({
      ...editingExam,
      sections: addToGroup(editingExam.sections)
    });
  };

  const handleRemoveQuestionFromGroup = (groupId: string, questionId: string) => {
    if (!editingExam) return;
    const removeFromGroup = (groups: GroupNode[]): GroupNode[] => {
      return groups.map(group => {
        if (group.id === groupId) {
          return { ...group, questions: group.questions.filter(q => q.id !== questionId) };
        }
        if (group.groups.length > 0) {
          return { ...group, groups: removeFromGroup(group.groups) };
        }
        return group;
      });
    };
    setEditingExam({
      ...editingExam,
      sections: removeFromGroup(editingExam.sections)
    });
  };

  const handleImportBankToGroup = (groupId: string, bankId: string) => {
    if (!editingExam) return;
    const bank = banks.find(b => b.id === bankId);
    if (!bank) return;
    
    const newQuestions: ExamQuestion[] = bank.questions.map(q => ({
      id: Date.now().toString() + Math.random(),
      sourceType: 'bank',
      sourceId: bank.id,
      question: { ...q, id: Date.now().toString() + Math.random() },
      overridePoints: q.points,
    }));
    
    const addToGroup = (groups: GroupNode[]): GroupNode[] => {
      return groups.map(group => {
        if (group.id === groupId) {
          return { ...group, questions: [...group.questions, ...newQuestions] };
        }
        if (group.groups.length > 0) {
          return { ...group, groups: addToGroup(group.groups) };
        }
        return group;
      });
    };
    setEditingExam({
      ...editingExam,
      sections: addToGroup(editingExam.sections)
    });
    setShowImportDialog(false);
    setSelectedBankToImport(null);
    setImportTargetGroupId(null);
  };

  const handleImportStandaloneToGroup = (groupId: string) => {
    if (!editingExam) return;
    const newQuestions: ExamQuestion[] = standaloneQuestions.map(q => ({
      id: Date.now().toString() + Math.random(),
      sourceType: 'standalone',
      sourceId: q.id,
      question: { ...q, id: Date.now().toString() + Math.random() },
      overridePoints: q.points,
    }));
    
    const addToGroup = (groups: GroupNode[]): GroupNode[] => {
      return groups.map(group => {
        if (group.id === groupId) {
          return { ...group, questions: [...group.questions, ...newQuestions] };
        }
        if (group.groups.length > 0) {
          return { ...group, groups: addToGroup(group.groups) };
        }
        return group;
      });
    };
    setEditingExam({
      ...editingExam,
      sections: addToGroup(editingExam.sections)
    });
    setShowImportDialog(false);
    setSelectedBankToImport(null);
    setImportTargetGroupId(null);
  };

  const handleExportExam = () => {
    if (!selectedExam) return;
    const exportData = {
      version: '0.3.4',
      exam: {
        id: selectedExam.id,
        title: selectedExam.title,
        description: selectedExam.description,
        subject: selectedExam.subject,
        conditions: selectedExam.conditions,
        sections: selectedExam.sections,
      }
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${selectedExam.title.replace(/[^a-z0-9]/gi, '_')}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    return type === 'MCQ' ? (lang === 'en' ? 'MCQ' : 'Múltiple') : (lang === 'en' ? 'Written' : 'Escrita');
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

  const getSecurityLevelColor = (level: string) => {
    return securityLevelColors[level as keyof typeof securityLevelColors] || '#666';
  };

  const formatTimeLimit = (time?: { days: number; hours: number; minutes: number; seconds: number }) => {
    if (!time) return t('no_limit', lang);
    const parts = [];
    if (time.days > 0) parts.push(`${time.days}${t('days', lang).charAt(0)}`);
    if (time.hours > 0) parts.push(`${time.hours}${t('hours', lang).charAt(0)}`);
    if (time.minutes > 0) parts.push(`${time.minutes}${t('minutes', lang).charAt(0)}`);
    if (time.seconds > 0) parts.push(`${time.seconds}${t('seconds', lang).charAt(0)}`);
    return parts.length > 0 ? parts.join(' ') : t('no_limit', lang);
  };

  const renderGroupTree = (groups: GroupNode[], level: number = 0): JSX.Element[] => {
    return groups.map((group, idx) => {
      const isExpanded = expandedGroups.has(group.id);
      const totalQuestions = group.questions.length + (group.groups.reduce((sum, g) => sum + g.questions.length, 0));
      
      // Determine the button text based on level
      const addButtonText = level === 0 ? t('new_module', lang) : (level === 1 ? t('new_submodule', lang) : t('new_submodule', lang));
      const addHandler = level === 0 ? () => handleAddModule(group.id) : () => handleAddSubmodule(group.id);
      
      return (
        <div key={group.id} style={{ marginBottom: '16px', marginLeft: level * 24 }}>
          {/* Group header with bracket visual */}
          <div style={{ 
            borderLeft: level > 0 ? `3px solid ${accentColor}` : 'none',
            paddingLeft: level > 0 ? '16px' : '0'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '6px',
              border: `1px solid ${accentColor}`,
              marginBottom: '8px'
            }}>
              <button 
                onClick={() => {
                  if (isExpanded) {
                    setExpandedGroups(prev => {
                      const next = new Set(prev);
                      next.delete(group.id);
                      return next;
                    });
                  } else {
                    setExpandedGroups(prev => new Set(prev).add(group.id));
                  }
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
              <span style={{ fontSize: '11px', color: accentColor, fontFamily: 'Roboto, sans-serif', fontWeight: 'bold' }}>
                {group.type === 'section' ? '📁' : (group.type === 'module' ? '📄' : '📌')}
              </span>
              <input 
                type="text" 
                value={group.name}
                onChange={(e) => handleUpdateGroupName(group.id, e.target.value)}
                style={{ flex: 1, background: 'none', border: 'none', fontWeight: 'bold', fontSize: '14px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
              />
              <span style={{ fontSize: '11px', color: '#666666', fontFamily: 'Roboto, sans-serif' }}>({totalQuestions} {t('questions_count', lang)})</span>
              
              <button onClick={addHandler} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontSize: '12px', fontFamily: 'Roboto, sans-serif', padding: '4px 8px' }}>
                {addButtonText}
              </button>
              <button onClick={() => {
                setImportTargetGroupId(group.id);
                setSelectedBankToImport(null);
                setShowImportDialog(true);
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontSize: '12px', fontFamily: 'Roboto, sans-serif', padding: '4px 8px' }}>
                📥 {t('import_bank', lang)}
              </button>
              <button onClick={() => {
                const blankQuestion: Question = {
                  id: Date.now().toString(),
                  type: 'MCQ',
                  text: '',
                  points: 1,
                  tags: [],
                  correctOptions: [''],
                  incorrectOptions: ['', ''],
                };
                handleAddQuestionToGroup(group.id, blankQuestion, 'blank');
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontSize: '12px', fontFamily: 'Roboto, sans-serif', padding: '4px 8px' }}>
                {t('add_blank', lang)}
              </button>
              <button onClick={() => handleDeleteGroup(group.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999999', fontSize: '12px', fontFamily: 'Roboto, sans-serif', padding: '4px 8px' }}>
                🗑
              </button>
            </div>
            
            {isExpanded && (
              <div style={{ paddingLeft: '8px' }}>
                {/* Questions in this group */}
                {group.questions.map((eq, qIdx) => (
                  <div key={eq.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '6px 8px',
                    marginLeft: '20px',
                    borderBottom: '1px solid #eee'
                  }}>
                    <span style={{ fontSize: '11px', color: accentColor, fontWeight: 'bold', fontFamily: 'Roboto, sans-serif' }}>Q{qIdx + 1}</span>
                    <span style={{ fontSize: '12px', flex: 1, color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{getQuestionPreview(eq.question)}</span>
                    <input 
                      type="number" 
                      value={eq.overridePoints || eq.question.points}
                      onChange={(e) => {
                        const newPoints = parseInt(e.target.value) || 0;
                        const updateQuestions = (groups: GroupNode[]): GroupNode[] => {
                          return groups.map(g => {
                            if (g.id === group.id) {
                              return { ...g, questions: g.questions.map(q => q.id === eq.id ? { ...q, overridePoints: newPoints } : q) };
                            }
                            if (g.groups.length > 0) {
                              return { ...g, groups: updateQuestions(g.groups) };
                            }
                            return g;
                          });
                        };
                        if (editingExam) {
                          setEditingExam({ ...editingExam, sections: updateQuestions(editingExam.sections) });
                        }
                      }}
                      style={{ width: '50px', padding: '2px 4px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '11px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                    />
                    <button onClick={() => handleRemoveQuestionFromGroup(group.id, eq.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999999', fontFamily: 'Roboto, sans-serif' }}>🗑</button>
                  </div>
                ))}
                
                {/* Child groups (modules/submodules) */}
                {group.groups.length > 0 && renderGroupTree(group.groups, level + 1)}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#ffffff', minHeight: '100vh', color: '#000000' }}>
      {/* Top bar */}
      <div style={{ backgroundColor: accentColor, padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '20px', color: '#ffffff', fontFamily: 'Roboto, sans-serif' }}>
            <span style={{ fontWeight: 'bold', fontFamily: 'Roboto, sans-serif' }}>LibreTest</span> {t('studio', lang)}
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <button onClick={() => { setActiveTab('home'); setViewMode('bank-list'); }} style={getTabStyle('home')}>{t('home', lang)}</button>
            <button onClick={() => setActiveTab('admin')} style={getTabStyle('admin')}>{t('admin', lang)}</button>
            <button onClick={() => { setActiveTab('questions'); setViewMode('bank-list'); }} style={getTabStyle('questions')}>{t('questions', lang)}</button>
            <button onClick={() => setActiveTab('exams')} style={getTabStyle('exams')}>{t('exams', lang)}</button>
            <button onClick={() => setActiveTab('scoring')} style={getTabStyle('scoring')}>{t('scoring', lang)}</button>
            <button onClick={() => setActiveTab('settings')} style={getTabStyle('settings')}>{t('settings', lang)}</button>
          </div>
          <div style={{ fontSize: '14px', color: '#ffffff', fontFamily: 'Roboto, sans-serif' }}>
            {formattedDate} | {formattedTime} | 🔋 {batteryPlaceholder}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
        {activeTab === 'home' && (
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '300px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>Recent Exams</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {displayExams.map((exam) => (
                  <div key={exam.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', fontFamily: 'Roboto, sans-serif', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '13px', color: '#666666', marginBottom: '8px', fontFamily: 'Roboto, sans-serif' }}>{exam.subject}</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{exam.title}</div>
                    <button style={{ padding: '6px 12px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Roboto, sans-serif' }}>
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
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => { setActiveTab('questions'); setShowBankDialog(true); }} style={{ padding: '10px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                  {t('new_question_bank', lang)}
                </button>
                <button onClick={() => setActiveTab('exams')} style={{ padding: '10px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                  {t('create_new_exam', lang)}
                </button>
                <button style={{ padding: '10px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                  {t('digitize_exam', lang)}
                </button>
                <button style={{ padding: '10px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                  {t('import_exam_json', lang)}
                </button>
              </div>
              <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f9f9f9', borderLeft: `3px solid ${accentColor}`, fontFamily: 'Roboto, sans-serif' }}>
                <p style={{ fontSize: '13px', color: '#555555', fontFamily: 'Roboto, sans-serif' }}>{t('tip', lang)}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666666', fontFamily: 'Roboto, sans-serif' }}>
            <h2 style={{ color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('admin', lang)}</h2>
            <p style={{ fontFamily: 'Roboto, sans-serif', color: '#000000' }}>User management, class rosters, and permissions will appear here.</p>
          </div>
        )}

        {activeTab === 'questions' && (
          <div style={{ fontFamily: 'Roboto, sans-serif' }}>
            {viewMode === 'bank-list' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('question_banks', lang)}</h2>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => { setViewMode('standalone-editor'); setSelectedQuestionId(standaloneQuestions[0]?.id || null); if (standaloneQuestions[0]) setEditingQuestion({ ...standaloneQuestions[0] }); }} style={{ padding: '8px 16px', backgroundColor: '#ffffff', color: accentColor, border: `1px solid ${accentColor}`, borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                      {t('standalone_questions', lang)}
                    </button>
                    <button onClick={() => { setEditingBank(null); setShowBankDialog(true); }} style={{ padding: '8px 16px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                      {t('new_bank', lang)}
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
                          color: '#ffffff',
                          cursor: 'pointer',
                          width: '80px',
                          height: '48px',
                          fontSize: '13px',
                          fontWeight: 500,
                          fontFamily: 'Roboto, sans-serif'
                        }}
                      >
                        {t('delete', lang)}
                      </button>
                      <div style={{ flex: 1, paddingLeft: '20px', fontSize: '15px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif' }}>
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
                        {t('configure', lang)}
                      </button>
                    </div>
                  ))}
                </div>

                {banks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999999', fontFamily: 'Roboto, sans-serif' }}>
                    <p style={{ fontFamily: 'Roboto, sans-serif', color: '#000000' }}>{t('no_banks', lang)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
                <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #e0e0e0', paddingRight: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <button onClick={handleBackToBanks} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>
                      {t('back_to_banks', lang)}
                    </button>
                    <button onClick={handleNewQuestion} style={{ padding: '6px 12px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>
                      + New
                    </button>
                  </div>
                  
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000000', fontFamily: 'Roboto, sans-serif', marginBottom: '12px' }}>
                    {viewMode === 'standalone-editor' ? t('standalone_questions', lang).replace(' →', '') : selectedBank?.name}
                  </h3>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <input 
                      type="text" 
                      placeholder={t('search', lang)} 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', fontSize: '13px', marginBottom: '8px', color: '#000000' }} 
                    />
                    <input 
                      type="text" 
                      placeholder={t('filter_by_tag', lang)} 
                      value={tagFilter} 
                      onChange={(e) => setTagFilter(e.target.value)} 
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#000000' }} 
                    />
                  </div>
                  
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
                          <span style={{ fontSize: '13px', fontWeight: 500, color: selectedQuestionId === question.id ? accentColor : '#666666', fontFamily: 'Roboto, sans-serif' }}>
                            #{idx + 1}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(question.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999999', fontSize: '12px', fontFamily: 'Roboto, sans-serif' }}
                          >
                            🗑
                          </button>
                        </div>
                        <div style={{ fontSize: '13px', color: '#000000', marginTop: '4px', fontFamily: 'Roboto, sans-serif' }}>
                          {getQuestionPreview(question)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999999', marginTop: '4px', fontFamily: 'Roboto, sans-serif' }}>
                          {question.points} {t('pts', lang)} | {question.tags.slice(0, 2).join(', ')}{question.tags.length > 2 ? '...' : ''}
                        </div>
                      </div>
                    ))}
                    {filteredQuestions.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999999', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>
                        {t('no_questions_found', lang)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingQuestion ? (
                    <div style={{ padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px', minHeight: '600px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>
                          {isNewQuestion ? t('new_question', lang) : `${t('edit_question', lang)} #${filteredQuestions.findIndex(q => q.id === editingQuestion.id) + 1}`}
                        </h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button onClick={handleCancelEdit} style={{ padding: '6px 16px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                            {t('cancel', lang)}
                          </button>
                          <button onClick={handleSaveQuestion} style={{ padding: '6px 16px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                            {t('save', lang)}
                          </button>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('type', lang)}</label>
                        <select 
                          value={editingQuestion.type}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as QuestionType })}
                          style={{ width: '200px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                        >
                          <option value="MCQ">{t('multiple_choice', lang)}</option>
                          <option value="WRITTEN">{t('written_response', lang)}</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('question_text', lang)}</label>
                        <textarea 
                          value={editingQuestion.text}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                        />
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('points', lang)}</label>
                        <input 
                          type="number" 
                          value={editingQuestion.points}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, points: parseInt(e.target.value) || 0 })}
                          style={{ width: '100px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                        />
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('tags', lang)}</label>
                        <input 
                          type="text" 
                          value={editingQuestion.tags.join(', ')}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                          placeholder="algebra, easy, derivatives"
                        />
                      </div>

                      {editingQuestion.type === 'MCQ' && (
                        <>
                          <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: accentColor, fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('correct_options', lang)}</label>
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
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                                placeholder="Correct option text"
                              />
                            ))}
                            <button 
                              onClick={() => setEditingQuestion({ ...editingQuestion, correctOptions: [...(editingQuestion.correctOptions || []), ''] })}
                              style={{ marginTop: '4px', background: 'none', border: 'none', color: accentColor, cursor: 'pointer', fontSize: '13px', fontFamily: 'Roboto, sans-serif' }}
                            >
                              {t('add_correct', lang)}
                            </button>
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#999999', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('incorrect_options', lang)}</label>
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
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                                placeholder="Incorrect option text"
                              />
                            ))}
                            <button 
                              onClick={() => setEditingQuestion({ ...editingQuestion, incorrectOptions: [...(editingQuestion.incorrectOptions || []), ''] })}
                              style={{ marginTop: '4px', background: 'none', border: 'none', color: '#999999', cursor: 'pointer', fontSize: '13px', fontFamily: 'Roboto, sans-serif' }}
                            >
                              {t('add_incorrect', lang)}
                            </button>
                          </div>
                        </>
                      )}

                      {editingQuestion.type === 'WRITTEN' && (
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('response_limits', lang)}</label>
                          
                          <select 
                            value={editingQuestion.limits?.mode || 'characters'}
                            onChange={(e) => setEditingQuestion({ 
                              ...editingQuestion, 
                              limits: { ...editingQuestion.limits, mode: e.target.value as 'characters' | 'words' | 'both' }
                            })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '12px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                          >
                            <option value="characters">{t('character_limit', lang)}</option>
                            <option value="words">{t('word_limit', lang)}</option>
                            <option value="both">{t('both_limits', lang)}</option>
                          </select>

                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#666666', fontFamily: 'Roboto, sans-serif' }}>{t('minimum', lang)}</label>
                              <input 
                                type="number"
                                value={editingQuestion.limits?.min || ''}
                                onChange={(e) => setEditingQuestion({ 
                                  ...editingQuestion, 
                                  limits: { ...editingQuestion.limits, min: e.target.value ? parseInt(e.target.value) : undefined }
                                })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                                placeholder={t('optional', lang)}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#666666', fontFamily: 'Roboto, sans-serif' }}>{t('maximum', lang)}</label>
                              <input 
                                type="number"
                                value={editingQuestion.limits?.max || ''}
                                onChange={(e) => setEditingQuestion({ 
                                  ...editingQuestion, 
                                  limits: { ...editingQuestion.limits, max: e.target.value ? parseInt(e.target.value) : undefined }
                                })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                                placeholder={t('optional', lang)}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#999999', fontFamily: 'Roboto, sans-serif' }}>
                      {currentQuestions.length === 0 ? (
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('no_questions_in_bank', lang)} {viewMode === 'standalone-editor' ? t('standalone', lang) : t('this_bank', lang)}.</p>
                          <button onClick={handleNewQuestion} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                            {t('create_first_question', lang)}
                          </button>
                        </div>
                      ) : (
                        <p style={{ color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('select_question_to_edit', lang)}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'exams' && (
          <div style={{ fontFamily: 'Roboto, sans-serif' }}>
            <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
              {/* Left Panel - Exam List */}
              <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #e0e0e0', paddingRight: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('exams_list', lang)}</h3>
                  <button onClick={handleCreateExam} style={{ padding: '6px 12px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>
                    {t('new_exam', lang)}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '500px', overflowY: 'auto' }}>
                  {exams.map((exam, idx) => (
                    <div 
                      key={exam.id}
                      onClick={() => handleSelectExam(exam)}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: selectedExamId === exam.id ? '#e8f5e9' : 'transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border: selectedExamId === exam.id ? `1px solid ${accentColor}` : '1px solid transparent',
                        fontFamily: 'Roboto, sans-serif'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: selectedExamId === exam.id ? accentColor : '#666666', fontFamily: 'Roboto, sans-serif' }}>
                          #{idx + 1}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999999', fontSize: '12px', fontFamily: 'Roboto, sans-serif' }}
                        >
                          🗑
                        </button>
                      </div>
                      <div style={{ fontSize: '13px', color: '#000000', marginTop: '4px', fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}>
                        {exam.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999999', marginTop: '4px', fontFamily: 'Roboto, sans-serif' }}>
                        {exam.sections.length} {t('sections_count', lang)} | {exam.conditions.questionOrderMode === 'auto' ? t('auto_order_badge', lang) : t('manual_badge', lang)}
                      </div>
                    </div>
                  ))}
                  {exams.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999999', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>
                      {t('no_exams', lang)}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Exam Editor */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingExam ? (
                  <div style={{ padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px', minHeight: '600px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                      <input 
                        type="text" 
                        value={editingExam.title}
                        onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                        style={{ fontSize: '20px', fontWeight: 'bold', color: '#000000', fontFamily: 'Roboto, sans-serif', background: 'none', border: 'none', borderBottom: `2px solid ${accentColor}`, padding: '4px 0', minWidth: '200px', flex: 1 }}
                      />
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button onClick={() => { setEditingExam(null); setSelectedExamId(null); setIsNewExam(false); }} style={{ padding: '6px 16px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                          {t('cancel', lang)}
                        </button>
                        <button onClick={handleUpdateExam} style={{ padding: '6px 16px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                          {t('save', lang)}
                        </button>
                        <button onClick={handleExportExam} style={{ padding: '6px 16px', backgroundColor: '#ffffff', color: accentColor, border: `1px solid ${accentColor}`, borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                          {t('export_json', lang).split(' ')[0]}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0', flexWrap: 'wrap' }}>
                      {(['metadata', 'groups', 'conditions', 'security', 'export'] as ExamTab[]).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setExamTab(tab)}
                          style={{
                            padding: '8px 16px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: examTab === tab ? 700 : 400,
                            color: examTab === tab ? accentColor : '#666666',
                            borderBottom: examTab === tab ? `2px solid ${accentColor}` : 'none',
                            textTransform: 'capitalize'
                          }}
                        >
                          {t(tab, lang)}
                        </button>
                      ))}
                    </div>

                    {examTab === 'metadata' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('description', lang)}</label>
                          <textarea 
                            value={editingExam.description || ''}
                            onChange={(e) => setEditingExam({ ...editingExam, description: e.target.value })}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                            placeholder={t('description', lang)}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('subject_course', lang)}</label>
                          <input 
                            type="text" 
                            value={editingExam.subject || ''}
                            onChange={(e) => setEditingExam({ ...editingExam, subject: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                            placeholder="e.g., MATH-2312"
                          />
                        </div>
                      </div>
                    )}

                    {examTab === 'groups' && (
                      <div>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                          <button onClick={handleAddSection} style={{ padding: '8px 16px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                            {t('new_section', lang)}
                          </button>
                        </div>

                        {editingExam.sections.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999999', border: '1px dashed #ddd', fontFamily: 'Roboto, sans-serif' }}>
                            <p style={{ color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('no_sections', lang)}</p>
                          </div>
                        ) : (
                          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {renderGroupTree(editingExam.sections, 0)}
                          </div>
                        )}

                        {/* Import Dialog */}
                        {showImportDialog && importTargetGroupId && (
                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                            <div style={{ background: '#ffffff', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: '500px', fontFamily: 'Roboto, sans-serif' }}>
                              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('import_bank', lang)}</h3>
                              <p style={{ fontSize: '13px', color: '#666666', marginBottom: '16px', fontFamily: 'Roboto, sans-serif' }}>
                                {t('select_bank_to_import', lang)}
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                                {banks.filter(b => b.questions.length > 0).map(bank => (
                                  <div 
                                    key={bank.id}
                                    onClick={() => setSelectedBankToImport(bank.id)}
                                    style={{
                                      padding: '12px',
                                      border: selectedBankToImport === bank.id ? `2px solid ${accentColor}` : '1px solid #e0e0e0',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      backgroundColor: selectedBankToImport === bank.id ? '#e8f5e9' : '#ffffff'
                                    }}
                                  >
                                    <div style={{ fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#000000' }}>{bank.name}</div>
                                    <div style={{ fontSize: '11px', color: '#666666', fontFamily: 'Roboto, sans-serif' }}>{bank.questions.length} {t('questions_count', lang)}</div>
                                  </div>
                                ))}
                                {standaloneQuestions.length > 0 && (
                                  <div 
                                    onClick={() => setSelectedBankToImport('__standalone__')}
                                    style={{
                                      padding: '12px',
                                      border: selectedBankToImport === '__standalone__' ? `2px solid ${accentColor}` : '1px solid #e0e0e0',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      backgroundColor: selectedBankToImport === '__standalone__' ? '#e8f5e9' : '#ffffff'
                                    }}
                                  >
                                    <div style={{ fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#000000' }}>📄 {t('standalone_questions', lang).replace(' →', '')}</div>
                                    <div style={{ fontSize: '11px', color: '#666666', fontFamily: 'Roboto, sans-serif' }}>{standaloneQuestions.length} {t('questions_count', lang)}</div>
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button onClick={() => { setShowImportDialog(false); setSelectedBankToImport(null); setImportTargetGroupId(null); }} style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                                  {t('cancel', lang)}
                                </button>
                                <button onClick={() => {
                                  if (importTargetGroupId) {
                                    if (selectedBankToImport === '__standalone__') {
                                      handleImportStandaloneToGroup(importTargetGroupId);
                                    } else if (selectedBankToImport) {
                                      handleImportBankToGroup(importTargetGroupId, selectedBankToImport);
                                    }
                                  }
                                }} disabled={!selectedBankToImport} style={{ padding: '8px 16px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '4px', cursor: selectedBankToImport ? 'pointer' : 'not-allowed', opacity: selectedBankToImport ? 1 : 0.5, fontFamily: 'Roboto, sans-serif' }}>
                                  {t('import_to_group', lang)}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {examTab === 'conditions' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('time_limit', lang)}</label>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input 
                                type="number" 
                                value={editingExam.conditions.timeLimit?.days || 0}
                                onChange={(e) => setEditingExam({ 
                                  ...editingExam, 
                                  conditions: { 
                                    ...editingExam.conditions, 
                                    timeLimit: { 
                                      ...editingExam.conditions.timeLimit || { hours: 0, minutes: 0, seconds: 0 },
                                      days: parseInt(e.target.value) || 0
                                    } 
                                  } 
                                })}
                                style={{ width: '70px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                                placeholder="0"
                              />
                              <span style={{ fontSize: '13px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('days', lang)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input 
                                type="number" 
                                value={editingExam.conditions.timeLimit?.hours || 0}
                                onChange={(e) => setEditingExam({ 
                                  ...editingExam, 
                                  conditions: { 
                                    ...editingExam.conditions, 
                                    timeLimit: { 
                                      ...editingExam.conditions.timeLimit || { days: 0, minutes: 0, seconds: 0 },
                                      hours: parseInt(e.target.value) || 0
                                    } 
                                  } 
                                })}
                                style={{ width: '70px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                                placeholder="0"
                              />
                              <span style={{ fontSize: '13px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('hours', lang)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input 
                                type="number" 
                                value={editingExam.conditions.timeLimit?.minutes || 0}
                                onChange={(e) => setEditingExam({ 
                                  ...editingExam, 
                                  conditions: { 
                                    ...editingExam.conditions, 
                                    timeLimit: { 
                                      ...editingExam.conditions.timeLimit || { days: 0, hours: 0, seconds: 0 },
                                      minutes: parseInt(e.target.value) || 0
                                    } 
                                  } 
                                })}
                                style={{ width: '70px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                                placeholder="0"
                              />
                              <span style={{ fontSize: '13px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('minutes', lang)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input 
                                type="number" 
                                value={editingExam.conditions.timeLimit?.seconds || 0}
                                onChange={(e) => setEditingExam({ 
                                  ...editingExam, 
                                  conditions: { 
                                    ...editingExam.conditions, 
                                    timeLimit: { 
                                      ...editingExam.conditions.timeLimit || { days: 0, hours: 0, minutes: 0 },
                                      seconds: parseInt(e.target.value) || 0
                                    } 
                                  } 
                                })}
                                style={{ width: '70px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                                placeholder="0"
                              />
                              <span style={{ fontSize: '13px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('seconds', lang)}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#666666', marginTop: '4px', fontFamily: 'Roboto, sans-serif' }}>
                            {formatTimeLimit(editingExam.conditions.timeLimit)}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('passing_score', lang)}</label>
                          <input 
                            type="number" 
                            value={editingExam.conditions.passingScore || ''}
                            onChange={(e) => setEditingExam({ ...editingExam, conditions: { ...editingExam.conditions, passingScore: e.target.value ? parseInt(e.target.value) : undefined } })}
                            style={{ width: '100px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                            placeholder={t('optional', lang)}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('question_order', lang)}</label>
                          <select 
                            value={editingExam.conditions.questionOrderMode}
                            onChange={(e) => setEditingExam({ ...editingExam, conditions: { ...editingExam.conditions, questionOrderMode: e.target.value as 'manual' | 'auto' } })}
                            style={{ width: '300px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', color: '#000000' }}
                          >
                            <option value="manual">{t('manual_order', lang)}</option>
                            <option value="auto">{t('auto_order', lang)}</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {examTab === 'security' && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('security_level', lang)}</label>
                        <select 
                          value={editingExam.conditions.securityLevel}
                          onChange={(e) => setEditingExam({ ...editingExam, conditions: { ...editingExam.conditions, securityLevel: e.target.value as any } })}
                          style={{ width: '200px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', marginBottom: '16px', color: '#000000' }}
                        >
                          <option value="Open">Open</option>
                          <option value="Protected">Protected</option>
                          <option value="Secure">Secure</option>
                          <option value="Very Secure">Very Secure</option>
                          <option value="Lockdown">Lockdown</option>
                        </select>
                        <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px', borderLeft: `3px solid ${getSecurityLevelColor(editingExam.conditions.securityLevel)}` }}>
                          <p style={{ fontSize: '12px', color: '#555555', fontFamily: 'Roboto, sans-serif' }}>
                            {t(securityLevelDescriptions[editingExam.conditions.securityLevel], lang)}
                          </p>
                        </div>
                      </div>
                    )}

                    {examTab === 'export' && (
                      <div>
                        <p style={{ marginBottom: '16px', color: '#666666', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>
                          {t('export_json', lang)}
                        </p>
                        <button onClick={handleExportExam} style={{ padding: '10px 20px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                          {t('download_json', lang)}
                        </button>
                        <div style={{ marginTop: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#000000', fontFamily: 'Roboto, sans-serif', fontSize: '13px' }}>{t('preview', lang)}</label>
                          <pre style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', overflow: 'auto', maxHeight: '300px', color: '#000000' }}>
                            {JSON.stringify({
                              version: '0.3.4',
                              exam: {
                                id: editingExam.id,
                                title: editingExam.title,
                                description: editingExam.description,
                                subject: editingExam.subject,
                                conditions: editingExam.conditions,
                                sections: editingExam.sections.length
                              }
                            }, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#999999', fontFamily: 'Roboto, sans-serif' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('select_exam', lang)}</p>
                      <button onClick={handleCreateExam} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: accentColor, color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>
                        {t('create_new_exam_button', lang)}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scoring' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666666', fontFamily: 'Roboto, sans-serif' }}>
            <h2 style={{ color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('scoring', lang)}</h2>
            <p style={{ fontFamily: 'Roboto, sans-serif', color: '#000000' }}>Creation of scoring systems will appear here.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'Roboto, sans-serif' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('settings_title', lang)}</h2>
            
            <div style={{ marginBottom: '24px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('time_format', lang)}</h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                  <input 
                    type="radio" 
                    value="12h" 
                    checked={settings.timeFormat === '12h'} 
                    onChange={() => setSettings({ ...settings, timeFormat: '12h' })}
                  />
                  {t('format_12h', lang)}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                  <input 
                    type="radio" 
                    value="24h" 
                    checked={settings.timeFormat === '24h'} 
                    onChange={() => setSettings({ ...settings, timeFormat: '24h' })}
                  />
                  {t('format_24h', lang)}
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '24px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('date_format', lang)}</h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                  <input 
                    type="radio" 
                    value="MM/DD/YYYY" 
                    checked={settings.dateFormat === 'MM/DD/YYYY'} 
                    onChange={() => setSettings({ ...settings, dateFormat: 'MM/DD/YYYY' })}
                  />
                  MM/DD/YYYY
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                  <input 
                    type="radio" 
                    value="DD/MM/YYYY" 
                    checked={settings.dateFormat === 'DD/MM/YYYY'} 
                    onChange={() => setSettings({ ...settings, dateFormat: 'DD/MM/YYYY' })}
                  />
                  DD/MM/YYYY
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                  <input 
                    type="radio" 
                    value="YYYY-MM-DD" 
                    checked={settings.dateFormat === 'YYYY-MM-DD'} 
                    onChange={() => setSettings({ ...settings, dateFormat: 'YYYY-MM-DD' })}
                  />
                  YYYY-MM-DD
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '24px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{t('language_settings', lang)}</h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                  <input 
                    type="radio" 
                    value="en" 
                    checked={settings.language === 'en'} 
                    onChange={() => setSettings({ ...settings, language: 'en' })}
                  />
                  {t('english', lang)}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                  <input 
                    type="radio" 
                    value="es" 
                    checked={settings.language === 'es'} 
                    onChange={() => setSettings({ ...settings, language: 'es' })}
                  />
                  {t('spanish', lang)}
                </label>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#666666', fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
              {t('settings_saved', lang)}
            </div>
          </div>
        )}
      </div>

      {/* Bank Dialog */}
      {showBankDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: '450px', fontFamily: 'Roboto, sans-serif' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#000000', fontFamily: 'Roboto, sans-serif' }}>{editingBank ? t('edit_question', lang) : t('new_question_bank', lang)}</h3>
            <input id="bankName" type="text" placeholder={lang === 'en' ? 'Bank name' : 'Nombre del banco'} defaultValue={editingBank?.name || ''} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '12px', fontFamily: 'Roboto, sans-serif', color: '#000000' }} />
            <textarea id="bankDescription" placeholder={lang === 'en' ? 'Description (optional)' : 'Descripción (opcional)'} defaultValue={editingBank?.description || ''} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px', marginBottom: '20px', fontFamily: 'Roboto, sans-serif', color: '#000000' }} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowBankDialog(false); setEditingBank(null); }} style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', color: '#000000' }}>{t('cancel', lang)}</button>
              <button onClick={() => {
                const name = (document.getElementById('bankName') as HTMLInputElement).value;
                const desc = (document.getElementById('bankDescription') as HTMLTextAreaElement).value;
                if (name.trim()) editingBank ? handleUpdateBank(editingBank.id, name.trim(), desc) : handleCreateBank(name.trim(), desc);
              }} style={{ padding: '8px 16px', background: accentColor, color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>{t('save', lang)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}