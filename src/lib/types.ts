export type UserRole = 'student' | 'examiner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  provider?: 'google' | 'email';
  createdAt: Date;
}

export interface Examiner extends User {
  role: 'examiner';
}

export interface Student extends User {
  role: 'student';
}

export type QuestionType = 
  | 'multiple_choice'
  | 'multiple_select'
  | 'true_false'
  | 'short_answer'
  | 'paragraph'
  | 'numerical'
  | 'code'
  | 'file_upload'
  | 'image_based'
  | 'match_following'
  | 'drag_drop';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  examId: string;
  questionText: string;
  questionType: QuestionType;
  options?: QuestionOption[];
  correctAnswer: string | string[] | number;
  marks: number;
  timer?: number;
  imageUrl?: string;
  pairs?: { left: string; right: string }[];
  orderItems?: string[];
}

export interface Exam {
  id: string;
  examCode: string;
  title: string;
  description: string;
  password: string;
  globalTimer: number;
  trustScoreThreshold: number;
  questions: Question[];
  createdBy: string;
  createdAt: Date;
  isPublished: boolean;
}

export interface ExamSession {
  id: string;
  examId: string;
  studentName: string;
  studentId: string;
  trustScore: number;
  currentQuestion: number;
  answers: { [questionId: string]: string | string[] | number };
  startedAt: Date;
  submittedAt?: Date;
  status: 'active' | 'terminated' | 'completed';
}

export type ViolationType = 
  | 'TAB_SWITCH'
  | 'COPY_ATTEMPT'
  | 'MULTIPLE_FACES'
  | 'FACE_MISSING'
  | 'PHONE_USAGE'
  | 'VOICE_DETECTED'
  | 'FULLSCREEN_EXIT'
  | 'LOOKING_AWAY'
  | 'DEVTOOLS_OPENED'
  | 'SCREENSHOT_ATTEMPT';

export interface Violation {
  id: string;
  sessionId: string;
  studentId: string;
  examId: string;
  type: ViolationType;
  timestamp: Date;
  details?: string;
}

export interface TrustScoreUpdate {
  sessionId: string;
  trustScore: number;
  violation: ViolationType;
  deduction: number;
}

export type RiskLevel = 'SAFE' | 'WARNING' | 'HIGH_RISK' | 'TERMINATED';

export interface CredibilityReport {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  marks: number;
  totalMarks: number;
  percentage: number;
  trustScore: number;
  riskLevel: RiskLevel;
  violations: Violation[];
  behaviorAnalysis: string;
  submittedAt: Date;
}

export interface TimerUpdate {
  globalTimer?: number;
  questionTimer?: number;
  questionNumber?: number;
}

export interface DashboardStats {
  totalExams: number;
  activeStudents: number;
  averageTrustScore: number;
  recentViolations: number;
}
