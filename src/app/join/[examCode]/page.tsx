'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, User, Hash, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { Exam } from '@/lib/types';

function JoinExamContent() {
  const params = useParams();
  const router = useRouter();
  const examCode = params.examCode as string;
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (examCode) {
      const foundExam = db.getExamByCode(examCode.toUpperCase());
      setExam(foundExam || null);
    }
  }, [examCode]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!exam) {
      setError('Exam not found');
      return;
    }

    if (exam.password && exam.password !== password) {
      setError('Invalid exam password');
      return;
    }

    if (!studentName || !studentId) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    const session = db.createSession({
      examId: exam.id,
      studentName,
      studentId,
      trustScore: 100,
      currentQuestion: 0,
      answers: {},
      status: 'active',
    });

    setTimeout(() => {
      router.push(`/exam/${session.id}`);
    }, 500);
  };

  if (!examCode) {
    return (
      <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-accent-primary/20 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-accent-primary" />
                </div>
                <span className="text-2xl font-bold">EXAM GUARDRAIL</span>
              </Link>
              <h1 className="text-2xl font-bold mt-6 mb-2">Join Exam</h1>
              <p className="text-text-secondary">Enter the exam code provided by your examiner</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const codeInput = (e.target as HTMLFormElement).elements.namedItem('examCode') as HTMLInputElement;
              if (codeInput.value) {
                router.push(`/join/${codeInput.value}`);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Exam Code</label>
                <input
                  name="examCode"
                  type="text"
                  placeholder="Enter exam code (e.g., ABC12)"
                  className="input-field text-center text-2xl font-mono tracking-widest uppercase"
                  maxLength={5}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-accent-primary text-background-primary font-semibold hover:bg-accent-secondary transition-all glow-button"
              >
                Find Exam
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-danger" />
            </div>
            <h2 className="text-xl font-bold mb-2">Exam Not Found</h2>
            <p className="text-text-secondary mb-6">
              No exam found with code "{examCode}"
            </p>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 text-accent-primary hover:text-accent-secondary transition-all"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Try another code
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-accent-primary/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-accent-primary" />
              </div>
              <span className="text-2xl font-bold">EXAM GUARDRAIL</span>
            </Link>
            <h1 className="text-2xl font-bold mt-6 mb-2">{exam.title}</h1>
            <p className="text-text-secondary">{exam.description}</p>
          </div>

          <div className="bg-background-secondary rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Questions:</span>
              <span className="font-semibold">{exam.questions.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-text-muted">Duration:</span>
              <span className="font-semibold">{exam.globalTimer} minutes</span>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Student Name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Hash className="w-4 h-4 inline mr-2" />
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your student ID"
                className="input-field"
                required
              />
            </div>

            {exam.password && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Exam Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter exam password"
                  className="input-field"
                  required
                />
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-accent-primary text-background-primary font-semibold hover:bg-accent-secondary transition-all glow-button disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Start Exam'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function JoinExamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <JoinExamContent />
    </Suspense>
  );
}
