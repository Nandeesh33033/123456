import { User, Exam, ExamSession, Violation, CredibilityReport, Question } from './types';
import { generateId, generateExamCode, calculateTrustScore, getRiskLevel, generateBehaviorAnalysis } from './utils';

class MockDatabase {
  users: Map<string, User> = new Map();
  exams: Map<string, Exam> = new Map();
  sessions: Map<string, ExamSession> = new Map();
  violations: Map<string, Violation[]> = new Map();
  reports: Map<string, CredibilityReport> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    const examiner: User = {
      id: 'examiner-1',
      name: 'Dr. Sarah Johnson',
      email: 'examiner@examguardrail.com',
      role: 'examiner',
      provider: 'email',
      createdAt: new Date(),
    };
    this.users.set(examiner.id, examiner);

    const sampleQuestions: Question[] = [
      {
        id: 'q1',
        examId: '',
        questionText: 'What is the capital of France?',
        questionType: 'multiple_choice',
        options: [
          { id: 'o1', text: 'London' },
          { id: 'o2', text: 'Paris' },
          { id: 'o3', text: 'Berlin' },
          { id: 'o4', text: 'Madrid' },
        ],
        correctAnswer: 'o2',
        marks: 10,
      },
      {
        id: 'q2',
        examId: '',
        questionText: 'Which of the following are programming languages?',
        questionType: 'multiple_select',
        options: [
          { id: 'o1', text: 'Python' },
          { id: 'o2', text: 'HTML' },
          { id: 'o3', text: 'JavaScript' },
          { id: 'o4', text: 'CSS' },
        ],
        correctAnswer: ['o1', 'o3'],
        marks: 10,
      },
      {
        id: 'q3',
        examId: '',
        questionText: 'The Earth is flat.',
        questionType: 'true_false',
        options: [
          { id: 'o1', text: 'True' },
          { id: 'o2', text: 'False' },
        ],
        correctAnswer: 'o2',
        marks: 5,
      },
    ];

    const sampleExam: Exam = {
      id: generateId(),
      examCode: 'SAMPLE',
      title: 'Sample Introduction Exam',
      description: 'A sample exam to demonstrate the platform features',
      password: 'sample123',
      globalTimer: 30,
      trustScoreThreshold: 50,
      questions: sampleQuestions.map(q => ({ ...q, examId: '' })),
      createdBy: examiner.id,
      createdAt: new Date(),
      isPublished: true,
    };
    sampleExam.questions = sampleQuestions.map(q => ({ ...q, examId: sampleExam.id }));
    this.exams.set(sampleExam.id, sampleExam);
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: generateId(),
      createdAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  createExam(exam: Omit<Exam, 'id' | 'createdAt'>): Exam {
    let examCode = exam.examCode || generateExamCode();
    while (!exam.examCode && Array.from(this.exams.values()).some(e => e.examCode === examCode)) {
      examCode = generateExamCode();
    }

    const newExam: Exam = {
      ...exam,
      id: generateId(),
      examCode,
      createdAt: new Date(),
    };
    this.exams.set(newExam.id, newExam);
    return newExam;
  }

  getExamByCode(examCode: string): Exam | undefined {
    return Array.from(this.exams.values()).find(e => e.examCode === examCode);
  }

  getExamById(id: string): Exam | undefined {
    return this.exams.get(id);
  }

  getExamsByExaminer(examinerId: string): Exam[] {
    return Array.from(this.exams.values()).filter(e => e.createdBy === examinerId);
  }

  createSession(session: Omit<ExamSession, 'id' | 'startedAt'>): ExamSession {
    const newSession: ExamSession = {
      ...session,
      id: generateId(),
      startedAt: new Date(),
    };
    this.sessions.set(newSession.id, newSession);
    this.violations.set(newSession.id, []);
    return newSession;
  }

  getSessionById(id: string): ExamSession | undefined {
    return this.sessions.get(id);
  }

  getSessionsByExam(examId: string): ExamSession[] {
    return Array.from(this.sessions.values()).filter(s => s.examId === examId);
  }

  updateSession(id: string, updates: Partial<ExamSession>): ExamSession | undefined {
    const session = this.sessions.get(id);
    if (session) {
      const updated = { ...session, ...updates };
      this.sessions.set(id, updated);
      return updated;
    }
    return undefined;
  }

  addViolation(violation: Omit<Violation, 'id' | 'timestamp'>): Violation {
    const newViolation: Violation = {
      ...violation,
      id: generateId(),
      timestamp: new Date(),
    };

    const sessionViolations = this.violations.get(violation.sessionId) || [];
    sessionViolations.push(newViolation);
    this.violations.set(violation.sessionId, sessionViolations);

    const session = this.sessions.get(violation.sessionId);
    if (session) {
      const violationCounts = this.getViolationCounts(violation.sessionId);
      const newTrustScore = calculateTrustScore(violationCounts);
      this.updateSession(violation.sessionId, { trustScore: newTrustScore });

      const exam = this.exams.get(session.examId);
      if (exam && newTrustScore < exam.trustScoreThreshold) {
        this.updateSession(violation.sessionId, { status: 'terminated' });
      }
    }

    return newViolation;
  }

  getViolations(sessionId: string): Violation[] {
    return this.violations.get(sessionId) || [];
  }

  getViolationCounts(sessionId: string): { type: Violation['type']; count: number }[] {
    const violations = this.getViolations(sessionId);
    const counts = new Map<Violation['type'], number>();

    violations.forEach(v => {
      counts.set(v.type, (counts.get(v.type) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
  }

  submitExam(sessionId: string, answers: { [questionId: string]: string | string[] | number }): CredibilityReport | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const exam = this.exams.get(session.examId);
    if (!exam) return undefined;

    let totalMarks = 0;
    let obtainedMarks = 0;

    exam.questions.forEach(question => {
      totalMarks += question.marks;
      const answer = answers[question.id];
      const correct = question.correctAnswer;

      if (Array.isArray(correct)) {
        if (Array.isArray(answer) && correct.length === answer.length && correct.every(c => answer.includes(c))) {
          obtainedMarks += question.marks;
        }
      } else if (answer === correct) {
        obtainedMarks += question.marks;
      }
    });

    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    const violations = this.getViolations(sessionId);
    const trustScore = calculateTrustScore(this.getViolationCounts(sessionId));
    const riskLevel = getRiskLevel(trustScore);
    const behaviorAnalysis = generateBehaviorAnalysis(trustScore, this.getViolationCounts(sessionId));

    const report: CredibilityReport = {
      id: generateId(),
      studentId: session.studentId,
      studentName: session.studentName,
      examId: exam.id,
      examTitle: exam.title,
      marks: obtainedMarks,
      totalMarks,
      percentage,
      trustScore,
      riskLevel,
      violations,
      behaviorAnalysis,
      submittedAt: new Date(),
    };

    this.reports.set(report.id, report);
    this.updateSession(sessionId, { 
      answers, 
      submittedAt: new Date(), 
      status: 'completed' 
    });

    return report;
  }

  getReportsByExam(examId: string): CredibilityReport[] {
    return Array.from(this.reports.values()).filter(r => r.examId === examId);
  }

  getAllExams(): Exam[] {
    return Array.from(this.exams.values());
  }

  getDashboardStats(examinerId: string) {
    const exams = this.getExamsByExaminer(examinerId);
    const activeExamIds = exams.map(e => e.id);
    const sessions = Array.from(this.sessions.values()).filter(
      s => activeExamIds.includes(s.examId) && s.status === 'active'
    );

    let totalTrustScore = 0;
    let trustScoreCount = 0;
    sessions.forEach(s => {
      totalTrustScore += s.trustScore;
      trustScoreCount++;
    });

    const allViolations = Array.from(this.violations.values()).flat();

    return {
      totalExams: exams.length,
      activeStudents: sessions.length,
      averageTrustScore: trustScoreCount > 0 ? Math.round(totalTrustScore / trustScoreCount) : 100,
      recentViolations: allViolations.filter(v => {
        const hoursSince = (Date.now() - v.timestamp.getTime()) / (1000 * 60 * 60);
        return hoursSince <= 24;
      }).length,
    };
  }
}

export const db = new MockDatabase();
