'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Brain, Lock, Users, Activity, FileCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-bg grid-pattern overflow-hidden">
      <div className="relative z-10">
        <nav className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent-primary/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-accent-primary" />
            </div>
            <span className="text-xl font-bold tracking-wide">EXAM GUARDRAIL</span>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-primary/10 border border-accent-primary/30 mb-6">
                <Brain className="w-4 h-4 text-accent-primary" />
                <span className="text-sm text-accent-primary font-medium">AI-Powered Security</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight"
            >
              <span className="text-text-primary">Secure Online </span>
              <span className="text-accent-primary">Examinations</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-text-secondary max-w-2xl mx-auto mb-12"
            >
              Prevent cheating with AI monitoring, real-time proctoring, and advanced trust scoring. 
              The future of secure online assessments.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/join">
                <button className="px-8 py-4 rounded-xl border-2 border-accent-primary text-accent-primary font-semibold text-lg hover:bg-accent-primary/10 transition-all glow-button">
                  Student Portal
                </button>
              </Link>
              <Link href="/examiner/login">
                <button className="px-8 py-4 rounded-xl bg-accent-primary text-background-primary font-semibold text-lg hover:bg-accent-secondary transition-all glow-button">
                  Examiner Login
                </button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6 mt-20"
          >
            {[
              {
                icon: Activity,
                title: 'AI Proctoring',
                description: 'Real-time face detection, gaze tracking, and object recognition using TensorFlow.js and MediaPipe'
              },
              {
                icon: Shield,
                title: 'Trust Scoring',
                description: 'Dynamic trust score from 100 that decreases with violations, auto-terminates when threshold is breached'
              },
              {
                icon: Lock,
                title: 'Browser Security',
                description: 'Fullscreen enforcement, copy/paste blocking, tab switch detection, and screenshot prevention'
              },
              {
                icon: Users,
                title: 'Live Monitoring',
                description: 'Real-time dashboard showing all students with trust scores, violations, and status indicators'
              },
              {
                icon: FileCheck,
                title: 'Exam Builder',
                description: 'Create exams with 11 question types including MCQ, code editor, and drag-drop ordering'
              },
              {
                icon: Brain,
                title: 'Credibility Reports',
                description: 'Generate comprehensive reports with marks, trust scores, risk levels, and behavior analysis'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 hover:border-accent-primary/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center mb-4 group-hover:bg-accent-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </motion.div>

          <footer className="text-center mt-20 text-text-muted text-sm">
            <p>&copy; 2026 Exam Guardrail System. All rights reserved.</p>
          </footer>
        </main>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background-primary pointer-events-none" />
    </div>
  );
}
