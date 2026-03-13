'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  AlertTriangle,
  Eye,
  X,
  Clock,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import { ExamSession, Exam, Violation } from '@/lib/types';
import { getRiskLevel, getRiskLevelColor, formatTime } from '@/lib/utils';

interface StudentData {
  session: ExamSession;
  exam: Exam;
  violations: Violation[];
}

export default function MonitorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/examiner/login');
      return;
    }

    const loadStudents = () => {
      const exams = db.getExamsByExaminer(user.id);
      const allSessions: StudentData[] = [];

      exams.forEach(exam => {
        const sessions = db.getSessionsByExam(exam.id);
        sessions.forEach(session => {
          if (session.status === 'active') {
            allSessions.push({
              session,
              exam,
              violations: db.getViolations(session.id),
            });
          }
        });
      });

      setStudents(allSessions);
    };

    loadStudents();
    const interval = setInterval(loadStudents, 3000);

    return () => clearInterval(interval);
  }, [user, router]);

  const getStatusColor = (trustScore: number) => {
    const level = getRiskLevel(trustScore);
    return getRiskLevelColor(level);
  };

  const getStatusText = (trustScore: number) => {
    const level = getRiskLevel(trustScore);
    return level;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="md:ml-72 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">Live Monitoring</h1>
          <p className="text-text-secondary mb-8">Monitor students in real-time</p>

          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Active Students</p>
                  <p className="text-2xl font-bold">{students.length}</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Safe</p>
                  <p className="text-2xl font-bold text-success">
                    {students.filter(s => getRiskLevel(s.session.trustScore) === 'SAFE').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Warning</p>
                  <p className="text-2xl font-bold text-warning">
                    {students.filter(s => getRiskLevel(s.session.trustScore) === 'WARNING').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">High Risk</p>
                  <p className="text-2xl font-bold text-danger">
                    {students.filter(s => getRiskLevel(s.session.trustScore) === 'HIGH_RISK').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Students</h3>
              <p className="text-text-secondary">
                Students taking exams will appear here in real-time
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium">Student</th>
                      <th className="text-left p-4 font-medium">Exam</th>
                      <th className="text-left p-4 font-medium">Trust Score</th>
                      <th className="text-left p-4 font-medium">Violations</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.session.id} className="border-b border-border hover:bg-background-secondary/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                              <User className="w-5 h-5 text-accent-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{student.session.studentName}</p>
                              <p className="text-sm text-text-muted">{student.session.studentId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{student.exam.title}</p>
                          <p className="text-sm text-text-muted">{student.exam.examCode}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Shield 
                              className="w-5 h-5" 
                              style={{ color: getStatusColor(student.session.trustScore) }} 
                            />
                            <span 
                              className="font-bold text-lg"
                              style={{ color: getStatusColor(student.session.trustScore) }}
                            >
                              {student.session.trustScore}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            student.violations.length > 0 
                              ? 'bg-danger/10 text-danger' 
                              : 'bg-success/10 text-success'
                          }`}>
                            {student.violations.length}
                          </span>
                        </td>
                        <td className="p-4">
                          <span 
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{ 
                              backgroundColor: `${getStatusColor(student.session.trustScore)}20`,
                              color: getStatusColor(student.session.trustScore)
                            }}
                          >
                            {getStatusText(student.session.trustScore)}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Student Details</h2>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 rounded-lg hover:bg-background-secondary transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-accent-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-accent-primary" />
                </div>
                <div>
                  <p className="text-xl font-semibold">{selectedStudent.session.studentName}</p>
                  <p className="text-text-secondary">{selectedStudent.session.studentId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background-secondary rounded-xl p-4">
                  <p className="text-sm text-text-muted mb-1">Trust Score</p>
                  <p 
                    className="text-3xl font-bold"
                    style={{ color: getStatusColor(selectedStudent.session.trustScore) }}
                  >
                    {selectedStudent.session.trustScore}
                  </p>
                </div>
                <div className="bg-background-secondary rounded-xl p-4">
                  <p className="text-sm text-text-muted mb-1">Status</p>
                  <p 
                    className="text-xl font-semibold"
                    style={{ color: getStatusColor(selectedStudent.session.trustScore) }}
                  >
                    {getStatusText(selectedStudent.session.trustScore)}
                  </p>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl p-4 mb-6">
                <h3 className="font-semibold mb-4">Exam: {selectedStudent.exam.title}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-muted">Exam Code</p>
                    <p className="font-medium">{selectedStudent.exam.examCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Duration</p>
                    <p className="font-medium">{selectedStudent.exam.globalTimer} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Questions</p>
                    <p className="font-medium">{selectedStudent.exam.questions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Threshold</p>
                    <p className="font-medium">{selectedStudent.exam.trustScoreThreshold}</p>
                  </div>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl p-4">
                <h3 className="font-semibold mb-4">
                  Violations ({selectedStudent.violations.length})
                </h3>
                {selectedStudent.violations.length === 0 ? (
                  <p className="text-text-secondary text-center py-4">No violations</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {selectedStudent.violations.map((v, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-3 rounded-lg bg-danger/5 border border-danger/20"
                      >
                        <span className="text-danger font-medium">
                          {v.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-text-muted text-sm">
                          {new Date(v.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
