'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileBarChart,
  Shield,
  AlertTriangle,
  User,
  X,
  Download,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import { CredibilityReport } from '@/lib/types';
import { getRiskLevelColor, getRiskLevel } from '@/lib/utils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<CredibilityReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<CredibilityReport | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/examiner/login');
      return;
    }

    const exams = db.getExamsByExaminer(user.id);
    const allReports: CredibilityReport[] = [];

    exams.forEach(exam => {
      const examReports = db.getReportsByExam(exam.id);
      allReports.push(...examReports);
    });

    setReports(allReports);
  }, [user, router]);

  const chartData = {
    labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
    datasets: [
      {
        label: 'Trust Score Distribution',
        data: [
          reports.filter(r => r.trustScore <= 20).length,
          reports.filter(r => r.trustScore > 20 && r.trustScore <= 40).length,
          reports.filter(r => r.trustScore > 40 && r.trustScore <= 60).length,
          reports.filter(r => r.trustScore > 60 && r.trustScore <= 80).length,
          reports.filter(r => r.trustScore > 80).length,
        ],
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
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
          <h1 className="text-3xl font-bold mb-2">Credibility Reports</h1>
          <p className="text-text-secondary mb-8">View student exam credibility analysis</p>

          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                  <FileBarChart className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Total Reports</p>
                  <p className="text-2xl font-bold">{reports.length}</p>
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
                    {reports.filter(r => r.riskLevel === 'SAFE').length}
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
                    {reports.filter(r => r.riskLevel === 'WARNING').length}
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
                    {reports.filter(r => r.riskLevel === 'HIGH_RISK' || r.riskLevel === 'TERMINATED').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {reports.length > 0 && (
            <div className="glass-card p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Trust Score Distribution</h2>
              <div className="h-[300px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {reports.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <FileBarChart className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
              <p className="text-text-secondary">
                Reports will appear here after students complete their exams
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 hover:border-accent-primary/50 transition-all cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-accent-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{report.studentName}</p>
                      <p className="text-sm text-text-muted">{report.studentId}</p>
                    </div>
                  </div>

                  <p className="text-text-secondary text-sm mb-4">{report.examTitle}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-muted">Trust Score</p>
                      <p 
                        className="text-2xl font-bold"
                        style={{ color: getRiskLevelColor(report.riskLevel) }}
                      >
                        {report.trustScore}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-muted">Marks</p>
                      <p className="text-2xl font-bold">
                        {report.marks} <span className="text-sm text-text-muted">/ {report.totalMarks}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: `${getRiskLevelColor(report.riskLevel)}20`,
                        color: getRiskLevelColor(report.riskLevel)
                      }}
                    >
                      {report.riskLevel}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Credibility Report</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 rounded-lg hover:bg-background-secondary transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-background-secondary rounded-xl p-4">
                  <h3 className="font-semibold mb-3">Student Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Name:</span>
                      <span>{selectedReport.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Student ID:</span>
                      <span>{selectedReport.studentId}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-background-secondary rounded-xl p-4">
                  <h3 className="font-semibold mb-3">Exam Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Exam:</span>
                      <span>{selectedReport.examTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Submitted:</span>
                      <span>{new Date(selectedReport.submittedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-background-secondary rounded-xl p-4 text-center">
                  <p className="text-sm text-text-muted mb-1">Marks</p>
                  <p className="text-3xl font-bold">
                    {selectedReport.marks} <span className="text-lg text-text-muted">/ {selectedReport.totalMarks}</span>
                  </p>
                  <p className="text-sm text-accent-primary">{selectedReport.percentage.toFixed(1)}%</p>
                </div>
                <div className="bg-background-secondary rounded-xl p-4 text-center">
                  <p className="text-sm text-text-muted mb-1">Trust Score</p>
                  <p 
                    className="text-3xl font-bold"
                    style={{ color: getRiskLevelColor(selectedReport.riskLevel) }}
                  >
                    {selectedReport.trustScore}
                  </p>
                </div>
                <div className="bg-background-secondary rounded-xl p-4 text-center">
                  <p className="text-sm text-text-muted mb-1">Risk Level</p>
                  <p 
                    className="text-2xl font-bold"
                    style={{ color: getRiskLevelColor(selectedReport.riskLevel) }}
                  >
                    {selectedReport.riskLevel}
                  </p>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl p-4 mb-6">
                <h3 className="font-semibold mb-3">Behavior Analysis</h3>
                <p className="text-text-secondary">{selectedReport.behaviorAnalysis}</p>
              </div>

              {selectedReport.violations.length > 0 && (
                <div className="bg-background-secondary rounded-xl p-4">
                  <h3 className="font-semibold mb-3">
                    Violation Summary ({selectedReport.violations.length})
                  </h3>
                  <div className="space-y-2">
                    {(() => {
                      const counts = new Map<string, number>();
                      selectedReport.violations.forEach(v => {
                        counts.set(v.type, (counts.get(v.type) || 0) + 1);
                      });
                      return Array.from(counts.entries()).map(([type, count], i) => (
                        <div key={i} className="flex justify-between p-2 rounded bg-danger/5">
                          <span className="text-danger">{type.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{count}x</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-primary text-background-primary font-semibold hover:bg-accent-secondary transition-all">
                  <Download className="w-5 h-5" />
                  Export PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
