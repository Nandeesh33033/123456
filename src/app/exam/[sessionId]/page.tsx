'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Camera,
  Mic,
  Monitor,
  Maximize2,
  Copy,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { db } from '@/lib/db';
import { Exam, ExamSession, Question, Violation, TrustScoreUpdate } from '@/lib/types';
import { formatTime, getRiskLevel, shuffleQuestions, shuffleArray, getViolationMessage } from '@/lib/utils';

interface Answer {
  value: string | string[] | number;
  matched?: boolean;
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<ExamSession | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: Answer }>({});
  const [globalTimer, setGlobalTimer] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [trustScore, setTrustScore] = useState(100);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [mouseInQuestion, setMouseInQuestion] = useState(true);
  const [copiedText, setCopiedText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sessionId) {
      const foundSession = db.getSessionById(sessionId);
      if (foundSession) {
        const foundExam = db.getExamById(foundSession.examId);
        if (foundExam) {
          setSession(foundSession);
          setExam(foundExam);
          setTrustScore(foundSession.trustScore);
          
          const shuffledQuestions = shuffleQuestions([...foundExam.questions]);
          setQuestions(shuffledQuestions);
          
          setGlobalTimer(foundExam.globalTimer * 60);
          
          if (shuffledQuestions[0]?.timer) {
            setQuestionTimer(shuffledQuestions[0].timer);
          }
        }
      } else {
        router.push('/join');
      }
    }
  }, [sessionId, router]);

  useEffect(() => {
    if (globalTimer > 0 || questionTimer > 0) {
      timerRef.current = setInterval(() => {
        setGlobalTimer(prev => {
          if (prev <= 1) {
            submitExam();
            return 0;
          }
          return prev - 1;
        });
        
        if (questionTimer > 0) {
          setQuestionTimer(prev => {
            if (prev <= 1) {
              moveToNextQuestion();
              return questions[currentQuestionIndex + 1]?.timer || 0;
            }
            return prev - 1;
          });
        }
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [globalTimer, questionTimer, currentQuestionIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key)) {
        e.preventDefault();
        logViolation('COPY_ATTEMPT');
      }
      
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        setShowOverlay(true);
        logViolation('SCREENSHOT_ATTEMPT');
        setTimeout(() => setShowOverlay(false), 3000);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('TAB_SWITCH');
        setWarningMessage('Tab switch detected! This has been logged.');
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }
    };

    const handleMouseLeave = () => {
      setMouseInQuestion(false);
    };

    const handleMouseEnter = () => {
      setMouseInQuestion(true);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logViolation('FULLSCREEN_EXIT');
        setWarningMessage('Fullscreen mode exited! Please return to fullscreen.');
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const questionContainer = document.getElementById('question-container');
    if (questionContainer) {
      questionContainer.addEventListener('mouseleave', handleMouseLeave);
      questionContainer.addEventListener('mouseenter', handleEnter);
    }

    function handleEnter() {
      setMouseInQuestion(true);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (questionContainer) {
        questionContainer.removeEventListener('mouseleave', handleMouseLeave);
        questionContainer.removeEventListener('mouseenter', handleEnter);
      }
    };
  }, []);

  useEffect(() => {
    if (exam) {
      const enterFullscreen = async () => {
        try {
          await document.documentElement.requestFullscreen();
        } catch (err) {
          console.log('Fullscreen not available');
        }
      };
      enterFullscreen();
    }
  }, [exam]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.log('Camera access denied or not available');
    }
  };

  const logViolation = (type: Violation['type']) => {
    if (!session) return;

    const violation = db.addViolation({
      sessionId: session.id,
      studentId: session.studentId,
      examId: session.examId,
      type,
    });

    setViolations(prev => [...prev, violation]);

    const sessionUpdated = db.getSessionById(session.id);
    if (sessionUpdated) {
      setTrustScore(sessionUpdated.trustScore);

      if (sessionUpdated.status === 'terminated') {
        terminateExam();
      }
    }
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      if (questions[nextIndex]?.timer) {
        setQuestionTimer(questions[nextIndex].timer);
      } else {
        setQuestionTimer(0);
      }
      
      setMouseInQuestion(true);
    }
  };

  const moveToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      
      if (questions[prevIndex]?.timer) {
        setQuestionTimer(questions[prevIndex].timer);
      } else {
        setQuestionTimer(0);
      }
      
      setMouseInQuestion(true);
    }
  };

  const submitExam = () => {
    if (!session || !exam) return;

    const answerMap: { [key: string]: string | string[] | number } = {};
    Object.entries(answers).forEach(([qId, answer]) => {
      answerMap[qId] = answer.value;
    });

    const report = db.submitExam(session.id, answerMap);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    router.push(`/exam/result/${session.id}`);
  };

  const terminateExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    router.push(`/exam/result/${sessionId}?terminated=true`);
  };

  const handleAnswer = (value: string | string[] | number) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { value }
    }));
  };

  const handleMultipleSelect = (optionId: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const currentAnswer = answers[currentQuestion.id]?.value as string[] || [];
    const newAnswer = currentAnswer.includes(optionId)
      ? currentAnswer.filter(id => id !== optionId)
      : [...currentAnswer, optionId];

    handleAnswer(newAnswer);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const riskLevel = getRiskLevel(trustScore);

  if (!session || !exam || questions.length === 0) {
    return (
      <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading exam...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <XCircle className="w-16 h-16 text-danger mx-auto mb-4" />
              <p className="text-xl font-semibold">Screenshot blocked!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-warning/20 border border-warning text-warning flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5" />
            {warningMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="fixed top-0 left-0 right-0 bg-background-secondary border-b border-border z-40">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h1 className="font-semibold">{exam.title}</h1>
              <p className="text-sm text-text-muted">{session.studentName} ({session.studentId})</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background-card">
              <Clock className="w-5 h-5 text-accent-primary" />
              <span className="font-mono text-xl">{formatTime(globalTimer)}</span>
            </div>

            {questionTimer > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background-card">
                <span className="text-sm text-text-muted">Q:</span>
                <span className="font-mono">{formatTime(questionTimer)}</span>
              </div>
            )}

            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              riskLevel === 'SAFE' ? 'bg-success/10' :
              riskLevel === 'WARNING' ? 'bg-warning/10' :
              'bg-danger/10'
            }`}>
              <Shield className={`w-5 h-5 ${
                riskLevel === 'SAFE' ? 'text-success' :
                riskLevel === 'WARNING' ? 'text-warning' :
                'text-danger'
              }`} />
              <span className={`font-semibold ${
                riskLevel === 'SAFE' ? 'text-success' :
                riskLevel === 'WARNING' ? 'text-warning' :
                'text-danger'
              }`}>
                {trustScore}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-20 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-6 mb-6">
            <div className="w-48 h-36 rounded-xl bg-background-card overflow-hidden shrink-0">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-text-muted" />
                </div>
              )}
            </div>

            <div className="flex-1 grid grid-cols-3 gap-4">
              <div className="glass-card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isFullscreen ? 'bg-success/10' : 'bg-danger/10'
                }`}>
                  <Maximize2 className={`w-5 h-5 ${isFullscreen ? 'text-success' : 'text-danger'}`} />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Fullscreen</p>
                  <p className={`font-semibold ${isFullscreen ? 'text-success' : 'text-danger'}`}>
                    {isFullscreen ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              <div className="glass-card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  cameraActive ? 'bg-success/10' : 'bg-danger/10'
                }`}>
                  <Camera className={`w-5 h-5 ${cameraActive ? 'text-success' : 'text-danger'}`} />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Camera</p>
                  <p className={`font-semibold ${cameraActive ? 'text-success' : 'text-danger'}`}>
                    {cameraActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              <div className="glass-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-warning/10">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Violations</p>
                  <p className="font-semibold text-warning">{violations.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div
            id="question-container"
            className={`glass-card p-8 transition-opacity duration-200 ${
              mouseInQuestion ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onMouseLeave={() => setMouseInQuestion(false)}
            onMouseEnter={() => setMouseInQuestion(true)}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-sm text-text-muted">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <h2 className="text-xl font-semibold mt-1">{currentQuestion?.questionText}</h2>
              </div>
              <div className="px-3 py-1 rounded-lg bg-accent-primary/10 text-accent-primary text-sm">
                {currentQuestion?.marks} marks
              </div>
            </div>

            <div className="space-y-3">
              {(currentQuestion?.questionType === 'multiple_choice' || 
                currentQuestion?.questionType === 'true_false') && (
                <>
                  {currentQuestion?.options?.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer(option.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        answers[currentQuestion.id]?.value === option.id
                          ? 'border-accent-primary bg-accent-primary/10'
                          : 'border-border hover:border-accent-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          answers[currentQuestion.id]?.value === option.id
                            ? 'border-accent-primary bg-accent-primary'
                            : 'border-text-muted'
                        }`}>
                          {answers[currentQuestion.id]?.value === option.id && (
                            <div className="w-2 h-2 rounded-full bg-background-primary" />
                          )}
                        </div>
                        <span>{option.text}</span>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {currentQuestion?.questionType === 'multiple_select' && (
                <>
                  {currentQuestion?.options?.map((option) => {
                    const selected = (answers[currentQuestion.id]?.value as string[] || []).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleMultipleSelect(option.id)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          selected
                            ? 'border-accent-primary bg-accent-primary/10'
                            : 'border-border hover:border-accent-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selected
                              ? 'border-accent-primary bg-accent-primary'
                              : 'border-text-muted'
                          }`}>
                            {selected && (
                              <CheckCircle className="w-4 h-4 text-background-primary" />
                            )}
                          </div>
                          <span>{option.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}

              {(currentQuestion?.questionType === 'short_answer' || 
                currentQuestion?.questionType === 'numerical') && (
                <input
                  type={currentQuestion?.questionType === 'numerical' ? 'number' : 'text'}
                  value={answers[currentQuestion.id]?.value as string || ''}
                  onChange={(e) => handleAnswer(
                    currentQuestion?.questionType === 'numerical' ? Number(e.target.value) : e.target.value
                  )}
                  placeholder={currentQuestion?.questionType === 'numerical' ? 'Enter number' : 'Type your answer'}
                  className="input-field text-lg"
                />
              )}

              {currentQuestion?.questionType === 'paragraph' && (
                <textarea
                  value={answers[currentQuestion.id]?.value as string || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Write your answer..."
                  className="input-field min-h-[200px] resize-none text-lg"
                />
              )}

              {currentQuestion?.questionType === 'code' && (
                <textarea
                  value={answers[currentQuestion.id]?.value as string || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="// Write your code here..."
                  className="input-field min-h-[200px] resize-none font-mono text-lg bg-black/50"
                />
              )}
            </div>
          </div>

          {!mouseInQuestion && (
            <div className="text-center py-12">
              <p className="text-text-secondary">Move your mouse back to the question to continue</p>
            </div>
          )}
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={moveToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border hover:bg-background-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentQuestionIndex(idx);
                  if (questions[idx]?.timer) {
                    setQuestionTimer(questions[idx].timer!);
                  } else {
                    setQuestionTimer(0);
                  }
                }}
                className={`w-10 h-10 rounded-lg transition-all ${
                  idx === currentQuestionIndex
                    ? 'bg-accent-primary text-background-primary'
                    : answers[questions[idx].id]
                      ? 'bg-success/20 text-success'
                      : 'bg-background-card text-text-muted hover:text-text-primary'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={submitExam}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-success text-background-primary font-semibold hover:bg-success/90 transition-all glow-button"
            >
              Submit Exam
              <CheckCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={moveToNextQuestion}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-primary text-background-primary font-semibold hover:bg-accent-secondary transition-all"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </footer>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
