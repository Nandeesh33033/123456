import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RiskLevel, ViolationType } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateExamCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function calculateTrustScore(
  violations: { type: ViolationType; count: number }[]
): number {
  const deductions: Record<ViolationType, number> = {
    TAB_SWITCH: 10,
    COPY_ATTEMPT: 15,
    MULTIPLE_FACES: 25,
    FACE_MISSING: 20,
    PHONE_USAGE: 20,
    VOICE_DETECTED: 15,
    FULLSCREEN_EXIT: 10,
    LOOKING_AWAY: 5,
    DEVTOOLS_OPENED: 20,
    SCREENSHOT_ATTEMPT: 15,
  };

  let score = 100;
  
  violations.forEach((violation) => {
    const deduction = deductions[violation.type] || 0;
    score -= deduction * violation.count;
  });

  return Math.max(0, score);
}

export function getRiskLevel(trustScore: number): RiskLevel {
  if (trustScore >= 80) return 'SAFE';
  if (trustScore >= 50) return 'WARNING';
  if (trustScore >= 40) return 'HIGH_RISK';
  return 'TERMINATED';
}

export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'SAFE':
      return '#22c55e';
    case 'WARNING':
      return '#f59e0b';
    case 'HIGH_RISK':
      return '#ef4444';
    case 'TERMINATED':
      return '#6b7280';
    default:
      return '#9ca3af';
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function shuffleQuestions<T extends { id: string }>(questions: T[]): T[] {
  return shuffleArray(questions);
}

export function getViolationMessage(type: ViolationType): string {
  const messages: Record<ViolationType, string> = {
    TAB_SWITCH: 'Tab switch detected',
    COPY_ATTEMPT: 'Copy/paste attempt detected',
    MULTIPLE_FACES: 'Multiple faces detected',
    FACE_MISSING: 'Face not visible',
    PHONE_USAGE: 'Phone detected',
    VOICE_DETECTED: 'External voice detected',
    FULLSCREEN_EXIT: 'Fullscreen mode exited',
    LOOKING_AWAY: 'Looking away from screen',
    DEVTOOLS_OPENED: 'Developer tools opened',
    SCREENSHOT_ATTEMPT: 'Screenshot attempt detected',
  };
  return messages[type] || 'Violation detected';
}

export function generateBehaviorAnalysis(
  trustScore: number,
  violations: { type: ViolationType; count: number }[]
): string {
  const riskLevel = getRiskLevel(trustScore);
  
  if (riskLevel === 'SAFE') {
    return 'Student maintained excellent exam integrity with no significant violations. The exam was taken honestly with proper conduct throughout.';
  }
  
  if (riskLevel === 'WARNING') {
    const violationTypes = violations.map(v => v.type.toLowerCase().replace('_', ' ')).join(', ');
    return `Minor violations detected including ${violationTypes}. Student showed some suspicious behavior but maintained reasonable exam integrity.`;
  }
  
  if (riskLevel === 'HIGH_RISK') {
    return 'Multiple serious violations detected. Student behavior indicates potential cheating attempts. Manual review recommended before grading.';
  }
  
  return 'Exam was terminated due to severe violations. Student behavior was completely unacceptable and indicates clear cheating attempt.';
}
