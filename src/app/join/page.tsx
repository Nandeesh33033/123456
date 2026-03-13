'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';

function JoinContent() {
  const router = useRouter();
  const [examCode, setExamCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (examCode.trim()) {
      router.push(`/join/${examCode.trim().toUpperCase()}`);
    }
  };

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Exam Code</label>
              <input
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                placeholder="Enter exam code (e.g., ABC12)"
                className="input-field text-center text-2xl font-mono tracking-widest uppercase"
                maxLength={5}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-accent-primary text-background-primary font-semibold hover:bg-accent-secondary transition-all glow-button flex items-center justify-center gap-2"
            >
              Find Exam
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-text-secondary hover:text-accent-primary transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
