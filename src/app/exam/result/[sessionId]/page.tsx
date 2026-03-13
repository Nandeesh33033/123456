'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  Home
} from 'lucide-react';
import { db } from '@/lib/db';
import { CredibilityReport } from '@/lib/types';
import { getRiskLevel, getRiskLevelColor } from '@/lib/utils';

function ResultContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const terminated = searchParams.get('terminated') === 'true';

  const [report, setReport] = useState<CredibilityReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = db.getSessionById(sessionId);
    if (session) {
      const exam = db.getExamById(session.examId);
      const violations = db.getViolations(sessionId);
      const violationCounts = db.getViolationCounts(sessionId);
      
      let totalMarks = 0;
      let obtainedMarks = 0;
      
      if (exam) {
        exam.questions.forEach(q => {
          totalMarks += q.marks;
          const answer = session.answers[q.id];
          const correct = q.correctAnswer;
          
          if (Array.isArray(correct)) {
            if (Array.isArray(answer) && correct.length === answer.length && correct.every(c => answer.includes(c))) {
              obtainedMarks += q.marks;
            }
          } else if (answer === correct) {
            obtainedMarks += q.marks;
          }
        });
      }

      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
      const trustScore = session.trustScore;
      const riskLevel = getRiskLevel(trustScore);

      const newReport: CredibilityReport = {
        id: sessionId,
        studentId: session.studentId,
        studentName: session.studentName,
        examId: session.examId,
        examTitle: exam?.title || 'Unknown Exam',
        marks: obtainedMarks,
        totalMarks,
        percentage,
        trustScore,
        riskLevel: terminated ? 'TERMINATED' : riskLevel,
        violations,
        behaviorAnalysis: terminated 
          ? 'Exam was terminated due to multiple violations.'
          : trustScore >= 80 
            ? 'Student maintained excellent exam integrity.'
            : trustScore >= 50 
              ? 'Minor violations detected but exam completed.'
              : 'Multiple serious violations detected.',
        submittedAt: session.submittedAt || new Date(),
      };

      setReport(newReport);
    }
    setLoading(false);
  }, [sessionId, terminated]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading results...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">No results found</p>
          <Link href="/join" className="text-accent-primary hover:text-accent-secondary">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const riskColor = getRiskLevelColor(report.riskLevel);

  return (
    <div className="min-h-screen gradient-bg grid-pattern py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
              terminated 
                ? 'bg-danger/20' 
                : report.riskLevel === 'SAFE' 
                  ? 'bg-success/20' 
                  : 'bg-warning/20'
            }`}>
              {terminated ? (
                <XCircle className="w-10 h-10 text-danger" />
              ) : report.riskLevel === 'SAFE' ? (
                <CheckCircle className="w-10 h-10 text-success" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-warning" />
              )}
            </div>

            <h1 className="text-3xl font-bold mb-2">
              {terminated ? 'Exam Terminated' : 'Exam Submitted'}
            </h1>
            <p className="text-text-secondary">{report.examTitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-background-secondary rounded-xl p-4 text-center">
              <p className="text-sm text-text-muted mb-1">Marks Obtained</p>
              <p className="text-3xl font-bold">
                {report.marks} <span className="text-lg text-text-muted">/ {report.totalMarks}</span>
              </p>
            </div>
            <div className="bg-background-secondary rounded-xl p-4 text-center">
              <p className="text-sm text-text-muted mb-1">Percentage</p>
              <p className="text-3xl font-bold">{report.percentage.toFixed(1)}%</p>
            </div>
            <div className="bg-background-secondary rounded-xl p-4 text-center">
              <p className="text-sm text-text-muted mb-1">Trust Score</p>
              <p className="text-3xl font-bold" style={{ color: riskColor }}>
                {report.trustScore}
              </p>
            </div>
            <div className="bg-background-secondary rounded-xl p-4 text-center">
              <p className="text-sm text-text-muted mb-1">Risk Level</p>
              <p className="text-2xl font-bold" style={{ color: riskColor }}>
                {report.riskLevel}
              </p>
            </div>
          </div>

          <div className="bg-background-secondary rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-2">Behavior Analysis</h3>
            <p className="text-text-secondary">{report.behaviorAnalysis}</p>
          </div>

          {report.violations.length > 0 && (
            <div className="bg-background-secondary rounded-xl p-4 mb-6">
              <h3 className="font-semibold mb-2">Violations ({report.violations.length})</h3>
              <div className="space-y-2">
                {report.violations.slice(-5).map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{v.type.replace('_', ' ')}</span>
                    <span className="text-text-muted">
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-background-secondary transition-all"
            >
              <Home className="w-5 h-5" />
              Home
            </Link>
            <Link
              href="/join"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-primary text-background-primary font-semibold hover:bg-accent-secondary transition-all"
            >
              <FileText className="w-5 h-5" />
              New Exam
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ExamResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
