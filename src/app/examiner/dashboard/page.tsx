'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LayoutDashboard,
  PlusCircle,
  ListChecks,
  Monitor,
  FileBarChart,
  Users,
  LogOut,
  Menu,
  X,
  Activity,
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import { DashboardStats } from '@/lib/types';

const navItems = [
  { href: '/examiner/dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
  { href: '/examiner/create-exam', label: 'Create Exam', icon: PlusCircle },
  { href: '/examiner/create-exam?tab=builder', label: 'Question Builder', icon: ListChecks },
  { href: '/examiner/monitor', label: 'Live Monitoring', icon: Monitor },
  { href: '/examiner/reports', label: 'Credibility Reports', icon: FileBarChart },
  { href: '/examiner/dashboard?tab=students', label: 'Students', icon: Users },
];

export default function ExaminerDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalExams: 0,
    activeStudents: 0,
    averageTrustScore: 100,
    recentViolations: 0
  });

  useEffect(() => {
    if (!user) {
      router.push('/examiner/login');
      return;
    }

    const dashboardStats = db.getDashboardStats(user.id);
    setStats(dashboardStats);
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background-primary">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-background-card border border-border md:hidden"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-background-secondary border-r border-border z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent-primary" />
            </div>
            <span className="text-lg font-bold">EXAM GUARDRAIL</span>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href.includes('?') && pathname.includes(item.href.split('?')[0]));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <span className="text-accent-primary font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-sm text-text-muted truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="md:ml-72 p-6 pt-20 md:pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
          <p className="text-text-secondary mb-8">Welcome back, {user.name}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: 'Total Exams',
                value: stats.totalExams,
                icon: ListChecks,
                color: 'bg-accent-primary/10',
                iconColor: 'text-accent-primary'
              },
              {
                title: 'Active Students',
                value: stats.activeStudents,
                icon: Users,
                color: 'bg-blue-500/10',
                iconColor: 'text-blue-500'
              },
              {
                title: 'Average Trust Score',
                value: `${stats.averageTrustScore}%`,
                icon: Shield,
                color: stats.averageTrustScore >= 80 ? 'bg-success/10' : 'bg-warning/10',
                iconColor: stats.averageTrustScore >= 80 ? 'text-success' : 'text-warning'
              },
              {
                title: 'Recent Violations',
                value: stats.recentViolations,
                icon: AlertTriangle,
                color: stats.recentViolations > 0 ? 'bg-danger/10' : 'bg-success/10',
                iconColor: stats.recentViolations > 0 ? 'text-danger' : 'text-success'
              }
            ].map((stat, index) => (
              <div key={index} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-text-secondary text-sm">{stat.title}</span>
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/examiner/create-exam"
                  className="p-4 rounded-xl bg-accent-primary/10 border border-accent-primary/30 hover:bg-accent-primary/20 transition-all group"
                >
                  <PlusCircle className="w-8 h-8 text-accent-primary mb-3" />
                  <p className="font-medium">Create New Exam</p>
                  <p className="text-sm text-text-secondary">Build a new exam with custom questions</p>
                </Link>
                <Link
                  href="/examiner/monitor"
                  className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all group"
                >
                  <Monitor className="w-8 h-8 text-blue-500 mb-3" />
                  <p className="font-medium">Live Monitoring</p>
                  <p className="text-sm text-text-secondary">View students taking exams in real-time</p>
                </Link>
                <Link
                  href="/examiner/reports"
                  className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-all group"
                >
                  <FileBarChart className="w-8 h-8 text-purple-500 mb-3" />
                  <p className="font-medium">View Reports</p>
                  <p className="text-sm text-text-secondary">Generate credibility reports</p>
                </Link>
                <Link
                  href="/examiner/dashboard?tab=students"
                  className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-all group"
                >
                  <Users className="w-8 h-8 text-orange-500 mb-3" />
                  <p className="font-medium">Manage Students</p>
                  <p className="text-sm text-text-secondary">View all student records</p>
                </Link>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">System Status</h2>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'AI Proctoring', status: 'Active', icon: Activity },
                  { label: 'Trust Score Engine', status: 'Running', icon: Shield },
                  { label: 'Timer Synchronization', status: 'Active', icon: Clock },
                  { label: 'Security Systems', status: 'Protected', icon: TrendingUp }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-accent-primary" />
                      <span>{item.label}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm bg-success/10 text-success">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
