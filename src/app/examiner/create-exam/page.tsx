'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  PlusCircle,
  Copy,
  Trash2,
  Eye,
  Save,
  Clock,
  Shield,
  Lock,
  ChevronDown,
  GripVertical,
  Check,
  X,
  Code,
  Image as ImageIcon,
  ListOrdered,
  Type,
  Hash,
  FileText,
  Upload,
  ArrowRightLeft,
  AlignLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import { Exam, Question, QuestionType, QuestionOption } from '@/lib/types';
import { generateId, shuffleArray } from '@/lib/utils';

const questionTypes: { type: QuestionType; label: string; icon: React.ElementType }[] = [
  { type: 'multiple_choice', label: 'Multiple Choice', icon: ListOrdered },
  { type: 'multiple_select', label: 'Multiple Select', icon: Check },
  { type: 'true_false', label: 'True/False', icon: Check },
  { type: 'short_answer', label: 'Short Answer', icon: Type },
  { type: 'paragraph', label: 'Paragraph', icon: AlignLeft },
  { type: 'numerical', label: 'Numerical', icon: Hash },
  { type: 'code', label: 'Code Editor', icon: Code },
  { type: 'file_upload', label: 'File Upload', icon: Upload },
  { type: 'image_based', label: 'Image Based', icon: ImageIcon },
  { type: 'match_following', label: 'Match Following', icon: ArrowRightLeft },
  { type: 'drag_drop', label: 'Drag & Drop', icon: GripVertical },
];

export default function CreateExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [globalTimer, setGlobalTimer] = useState(30);
  const [trustScoreThreshold, setTrustScoreThreshold] = useState(50);
  const [examPassword, setExamPassword] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedExam, setPublishedExam] = useState<Exam | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/examiner/login');
    }
  }, [user, router]);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: generateId(),
      examId: '',
      questionText: '',
      questionType: type,
      options: type === 'multiple_choice' || type === 'multiple_select' || type === 'true_false'
        ? [
            { id: generateId(), text: 'Option 1' },
            { id: generateId(), text: 'Option 2' },
            { id: generateId(), text: 'Option 3' },
            { id: generateId(), text: 'Option 4' },
          ]
        : undefined,
      correctAnswer: '',
      marks: 10,
      timer: undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const duplicateQuestion = (index: number) => {
    const question = questions[index];
    const duplicate: Question = {
      ...question,
      id: generateId(),
      questionText: question.questionText + ' (Copy)',
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicate);
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options![optionIndex].text = text;
      setQuestions(newQuestions);
    }
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options!.push({
        id: generateId(),
        text: `Option ${newQuestions[questionIndex].options!.length + 1}`,
      });
      setQuestions(newQuestions);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options && newQuestions[questionIndex].options!.length > 2) {
      newQuestions[questionIndex].options!.splice(optionIndex, 1);
      setQuestions(newQuestions);
    }
  };

  const setCorrectAnswer = (questionIndex: number, answer: string, isMultiple = false) => {
    const newQuestions = [...questions];
    const current = newQuestions[questionIndex].correctAnswer;
    
    if (isMultiple) {
      const currentArr = Array.isArray(current) ? current : [];
      if (currentArr.includes(answer)) {
        newQuestions[questionIndex].correctAnswer = currentArr.filter(a => a !== answer);
      } else {
        newQuestions[questionIndex].correctAnswer = [...currentArr, answer];
      }
    } else {
      newQuestions[questionIndex].correctAnswer = answer;
    }
    setQuestions(newQuestions);
  };

  const publishExam = async () => {
    if (!examTitle || questions.length === 0 || !user) return;

    setPublishing(true);

    const exam = db.createExam({
      examCode: '',
      title: examTitle,
      description: examDescription,
      password: examPassword,
      globalTimer,
      trustScoreThreshold,
      questions: questions.map(q => ({ ...q, examId: '' })),
      createdBy: user.id,
      isPublished: true,
    });

    const updatedQuestions = questions.map(q => ({ ...q, examId: exam.id }));
    exam.questions = updatedQuestions;

    setTimeout(() => {
      setPublishedExam(exam);
      setPublishing(false);
    }, 1000);
  };

  const getQuestionTypeIcon = (type: QuestionType) => {
    const found = questionTypes.find(qt => qt.type === type);
    return found ? found.icon : ListOrdered;
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
          <h1 className="text-3xl font-bold mb-2">Create Exam</h1>
          <p className="text-text-secondary mb-8">Build your exam with custom questions</p>

          {publishedExam ? (
            <div className="glass-card p-8 max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Exam Published Successfully!</h2>
              <div className="bg-background-secondary rounded-xl p-6 mb-6">
                <p className="text-text-secondary mb-2">Exam Code</p>
                <p className="text-4xl font-bold text-accent-primary">{publishedExam.examCode}</p>
              </div>
              <div className="bg-background-secondary rounded-xl p-6 mb-6">
                <p className="text-text-secondary mb-2">Password</p>
                <p className="text-2xl font-bold">{publishedExam.password || 'No password'}</p>
              </div>
              <div className="bg-background-secondary rounded-xl p-6 mb-6">
                <p className="text-text-secondary mb-2">Join URL</p>
                <p className="text-lg font-mono">https://examguardrail.app/join/{publishedExam.examCode}</p>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/examiner/monitor')}
                  className="px-6 py-3 rounded-xl bg-accent-primary text-background-primary font-semibold hover:bg-accent-secondary transition-all"
                >
                  Go to Monitor
                </button>
                <button
                  onClick={() => {
                    setPublishedExam(null);
                    setExamTitle('');
                    setQuestions([]);
                  }}
                  className="px-6 py-3 rounded-xl border border-border hover:bg-background-secondary transition-all"
                >
                  Create Another Exam
                </button>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="glass-card p-6">
                  <h2 className="text-xl font-semibold mb-4">Exam Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Exam Title *</label>
                      <input
                        type="text"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        placeholder="Enter exam title"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={examDescription}
                        onChange={(e) => setExamDescription(e.target.value)}
                        placeholder="Enter exam description"
                        className="input-field min-h-[100px] resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Global Timer (minutes)
                      </label>
                      <input
                        type="number"
                        value={globalTimer}
                        onChange={(e) => setGlobalTimer(Number(e.target.value))}
                        min={1}
                        max={180}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Shield className="w-4 h-4 inline mr-2" />
                        Trust Score Threshold
                      </label>
                      <input
                        type="number"
                        value={trustScoreThreshold}
                        onChange={(e) => setTrustScoreThreshold(Number(e.target.value))}
                        min={0}
                        max={100}
                        className="input-field"
                      />
                      <p className="text-xs text-text-muted mt-1">
                        Exam will terminate if trust score drops below this value
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Lock className="w-4 h-4 inline mr-2" />
                        Exam Password (optional)
                      </label>
                      <input
                        type="text"
                        value={examPassword}
                        onChange={(e) => setExamPassword(e.target.value)}
                        placeholder="Enter password"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h2 className="text-xl font-semibold mb-4">Add Question</h2>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {questionTypes.map((qt) => (
                      <button
                        key={qt.type}
                        onClick={() => addQuestion(qt.type)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-background-secondary hover:bg-accent-primary/10 hover:text-accent-primary transition-all text-left"
                      >
                        <qt.icon className="w-5 h-5" />
                        {qt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                      Questions ({questions.length})
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPreview(true)}
                        disabled={questions.length === 0}
                        className="px-4 py-2 rounded-lg border border-border hover:bg-background-secondary transition-all disabled:opacity-50"
                      >
                        <Eye className="w-4 h-4 inline mr-2" />
                        Preview
                      </button>
                      <button
                        onClick={publishExam}
                        disabled={!examTitle || questions.length === 0 || publishing}
                        className="px-4 py-2 rounded-lg bg-accent-primary text-background-primary font-semibold hover:bg-accent-secondary transition-all disabled:opacity-50 glow-button"
                      >
                        {publishing ? (
                          'Publishing...'
                        ) : (
                          <>
                            <Save className="w-4 h-4 inline mr-2" />
                            Publish Exam
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {questions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-text-secondary">No questions yet. Add a question from the panel.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {questions.map((question, qIndex) => {
                        const TypeIcon = getQuestionTypeIcon(question.questionType);
                        return (
                          <div key={question.id} className="bg-background-secondary rounded-xl p-4">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary font-semibold">
                                {qIndex + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <TypeIcon className="w-4 h-4 text-text-muted" />
                                  <span className="text-sm text-text-muted">
                                    {questionTypes.find(qt => qt.type === question.questionType)?.label}
                                  </span>
                                </div>
                                <textarea
                                  value={question.questionText}
                                  onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })}
                                  placeholder="Enter your question..."
                                  className="input-field min-h-[80px] resize-none"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => duplicateQuestion(qIndex)}
                                  className="p-2 rounded-lg hover:bg-background-card transition-all"
                                  title="Duplicate"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteQuestion(qIndex)}
                                  className="p-2 rounded-lg hover:bg-danger/10 text-danger transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {(question.questionType === 'multiple_choice' || 
                              question.questionType === 'multiple_select' ||
                              question.questionType === 'true_false') && (
                              <div className="ml-12 space-y-2">
                                {question.options?.map((option, oIndex) => (
                                  <div key={option.id} className="flex items-center gap-3">
                                    {question.questionType === 'multiple_select' ? (
                                      <input
                                        type="checkbox"
                                        checked={Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option.id)}
                                        onChange={() => setCorrectAnswer(qIndex, option.id, true)}
                                        className="w-4 h-4 rounded accent-accent-primary"
                                      />
                                    ) : (
                                      <input
                                        type="radio"
                                        name={`question-${qIndex}`}
                                        checked={question.correctAnswer === option.id}
                                        onChange={() => setCorrectAnswer(qIndex, option.id)}
                                        className="w-4 h-4 accent-accent-primary"
                                      />
                                    )}
                                    <input
                                      type="text"
                                      value={option.text}
                                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                      className="input-field flex-1"
                                      placeholder={`Option ${oIndex + 1}`}
                                    />
                                    <button
                                      onClick={() => removeOption(qIndex, oIndex)}
                                      className="p-2 rounded-lg hover:bg-danger/10 text-danger transition-all"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => addOption(qIndex)}
                                  className="flex items-center gap-2 text-sm text-accent-primary hover:text-accent-secondary transition-all"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                  Add Option
                                </button>
                              </div>
                            )}

                            {question.questionType === 'short_answer' && (
                              <div className="ml-12">
                                <input
                                  type="text"
                                  value={question.correctAnswer as string}
                                  onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })}
                                  placeholder="Expected answer (for auto-grading)"
                                  className="input-field"
                                />
                              </div>
                            )}

                            {question.questionType === 'numerical' && (
                              <div className="ml-12">
                                <input
                                  type="number"
                                  value={question.correctAnswer as string}
                                  onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })}
                                  placeholder="Correct numerical answer"
                                  className="input-field"
                                />
                              </div>
                            )}

                            {question.questionType === 'paragraph' && (
                              <div className="ml-12">
                                <textarea
                                  value={question.correctAnswer as string}
                                  onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })}
                                  placeholder="Expected answer (for auto-grading)"
                                  className="input-field min-h-[100px] resize-none"
                                />
                              </div>
                            )}

                            {question.questionType === 'code' && (
                              <div className="ml-12">
                                <input
                                  type="text"
                                  value={question.correctAnswer as string}
                                  onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })}
                                  placeholder="Expected code output"
                                  className="input-field"
                                />
                              </div>
                            )}

                            <div className="flex gap-4 mt-4 ml-12">
                              <div>
                                <label className="block text-sm text-text-muted mb-1">Marks</label>
                                <input
                                  type="number"
                                  value={question.marks}
                                  onChange={(e) => updateQuestion(qIndex, { marks: Number(e.target.value) })}
                                  min={1}
                                  className="input-field w-24"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-text-muted mb-1">Timer (sec)</label>
                                <input
                                  type="number"
                                  value={question.timer || ''}
                                  onChange={(e) => updateQuestion(qIndex, { timer: e.target.value ? Number(e.target.value) : undefined })}
                                  placeholder="Optional"
                                  className="input-field w-24"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
