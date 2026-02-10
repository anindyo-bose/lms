/**
 * Quiz Service - Database operations for quizzes and attempts
 */

import { Pool } from 'pg';

// Types
interface Quiz {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimit?: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  maxAttempts?: number;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

interface Question {
  id: string;
  quizId: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'multi-select';
  text: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  points: number;
  order: number;
  explanation?: string;
}

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  passed: boolean;
  answers: QuizAnswer[];
}

interface QuizAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  isCorrect?: boolean;
  points: number;
}

interface QuizResult {
  attemptId: string;
  quizId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  questionResults: QuestionResult[];
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  type: Question['type'];
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  explanation?: string;
}

// Quiz database pool
let pool: Pool;

export function initQuizService(dbPool: Pool): void {
  pool = dbPool;
}

/**
 * Get quiz by ID with questions
 */
export async function getQuizById(quizId: string): Promise<Quiz | null> {
  const quizResult = await pool.query(
    `SELECT q.*, c.id as course_id
     FROM quizzes q
     JOIN lessons l ON q.lesson_id = l.id
     JOIN courses c ON l.course_id = c.id
     WHERE q.id = $1 AND q.deleted_at IS NULL`,
    [quizId]
  );

  if (quizResult.rows.length === 0) return null;

  const quiz = quizResult.rows[0];

  // Get questions
  const questionsResult = await pool.query(
    `SELECT * FROM quiz_questions
     WHERE quiz_id = $1
     ORDER BY "order" ASC`,
    [quizId]
  );

  // Get options for each question
  const questionIds = questionsResult.rows.map((q) => q.id);
  let optionsMap: Record<string, QuestionOption[]> = {};

  if (questionIds.length > 0) {
    const optionsResult = await pool.query(
      `SELECT * FROM question_options
       WHERE question_id = ANY($1)
       ORDER BY "order" ASC`,
      [questionIds]
    );

    optionsMap = optionsResult.rows.reduce((acc, opt) => {
      if (!acc[opt.question_id]) acc[opt.question_id] = [];
      acc[opt.question_id].push({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.is_correct,
      });
      return acc;
    }, {} as Record<string, QuestionOption[]>);
  }

  const questions: Question[] = questionsResult.rows.map((q) => ({
    id: q.id,
    quizId: q.quiz_id,
    type: q.type,
    text: q.text,
    options: optionsMap[q.id] || [],
    correctAnswer: q.correct_answer,
    points: q.points,
    order: q.order,
    explanation: q.explanation,
  }));

  return {
    id: quiz.id,
    lessonId: quiz.lesson_id,
    courseId: quiz.course_id,
    title: quiz.title,
    description: quiz.description,
    passingScore: quiz.passing_score,
    timeLimit: quiz.time_limit,
    shuffleQuestions: quiz.shuffle_questions,
    showResults: quiz.show_results,
    maxAttempts: quiz.max_attempts,
    questions,
    createdAt: quiz.created_at,
    updatedAt: quiz.updated_at,
  };
}

/**
 * Get quiz by lesson ID
 */
export async function getQuizByLessonId(lessonId: string): Promise<Quiz | null> {
  const result = await pool.query(
    `SELECT id FROM quizzes WHERE lesson_id = $1 AND deleted_at IS NULL`,
    [lessonId]
  );

  if (result.rows.length === 0) return null;

  return getQuizById(result.rows[0].id);
}

/**
 * Create a new quiz attempt
 */
export async function createAttempt(
  quizId: string,
  userId: string
): Promise<QuizAttempt> {
  const result = await pool.query(
    `INSERT INTO quiz_attempts (quiz_id, user_id, started_at, passed)
     VALUES ($1, $2, NOW(), false)
     RETURNING *`,
    [quizId, userId]
  );

  return {
    id: result.rows[0].id,
    quizId: result.rows[0].quiz_id,
    userId: result.rows[0].user_id,
    startedAt: result.rows[0].started_at,
    completedAt: result.rows[0].completed_at,
    score: result.rows[0].score,
    passed: result.rows[0].passed,
    answers: [],
  };
}

/**
 * Get attempt count for a user on a quiz
 */
export async function getAttemptCount(
  quizId: string,
  userId: string
): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM quiz_attempts
     WHERE quiz_id = $1 AND user_id = $2`,
    [quizId, userId]
  );

  return parseInt(result.rows[0].count, 10);
}

/**
 * Get all attempts for a quiz by user
 */
export async function getUserAttempts(
  quizId: string,
  userId: string
): Promise<QuizAttempt[]> {
  const result = await pool.query(
    `SELECT * FROM quiz_attempts
     WHERE quiz_id = $1 AND user_id = $2
     ORDER BY started_at DESC`,
    [quizId, userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    quizId: row.quiz_id,
    userId: row.user_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    score: row.score,
    passed: row.passed,
    answers: [],
  }));
}

/**
 * Submit quiz answers and calculate result
 */
export async function submitQuiz(
  attemptId: string,
  answers: QuizAnswer[]
): Promise<QuizResult> {
  // Get attempt
  const attemptResult = await pool.query(
    `SELECT qa.*, q.*
     FROM quiz_attempts qa
     JOIN quizzes q ON qa.quiz_id = q.id
     WHERE qa.id = $1`,
    [attemptId]
  );

  if (attemptResult.rows.length === 0) {
    throw new Error('Attempt not found');
  }

  const attempt = attemptResult.rows[0];
  const quiz = await getQuizById(attempt.quiz_id);

  if (!quiz) {
    throw new Error('Quiz not found');
  }

  // Calculate score
  let totalScore = 0;
  let totalPoints = 0;
  const questionResults: QuestionResult[] = [];

  for (const question of quiz.questions) {
    totalPoints += question.points;
    const answer = answers.find((a) => a.questionId === question.id);

    let isCorrect = false;
    let userAnswer: string | string[] = '';
    let correctAnswer: string | string[] = '';
    let pointsEarned = 0;

    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const correctOption = question.options?.find((o) => o.isCorrect);
      correctAnswer = correctOption?.text || '';
      const selectedOption = question.options?.find((o) =>
        answer?.selectedOptionIds?.includes(o.id)
      );
      userAnswer = selectedOption?.text || '';
      isCorrect = selectedOption?.isCorrect || false;
    } else if (question.type === 'multi-select') {
      const correctOptions = question.options?.filter((o) => o.isCorrect) || [];
      correctAnswer = correctOptions.map((o) => o.text);
      const selectedOptions =
        question.options?.filter((o) =>
          answer?.selectedOptionIds?.includes(o.id)
        ) || [];
      userAnswer = selectedOptions.map((o) => o.text);

      // All correct options selected and no incorrect ones
      const correctIds = new Set(correctOptions.map((o) => o.id));
      const selectedIds = new Set(answer?.selectedOptionIds || []);
      isCorrect =
        correctIds.size === selectedIds.size &&
        [...correctIds].every((id) => selectedIds.has(id));
    } else if (question.type === 'short-answer') {
      correctAnswer = question.correctAnswer || '';
      userAnswer = answer?.textAnswer || '';
      isCorrect =
        userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }

    if (isCorrect) {
      pointsEarned = question.points;
      totalScore += pointsEarned;
    }

    // Save answer
    await pool.query(
      `INSERT INTO quiz_answers (attempt_id, question_id, selected_option_ids, text_answer, is_correct, points_earned)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        attemptId,
        question.id,
        answer?.selectedOptionIds || null,
        answer?.textAnswer || null,
        isCorrect,
        pointsEarned,
      ]
    );

    questionResults.push({
      questionId: question.id,
      questionText: question.text,
      type: question.type,
      userAnswer,
      correctAnswer,
      isCorrect,
      pointsEarned,
      pointsPossible: question.points,
      explanation: question.explanation,
    });
  }

  const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
  const passed = percentage >= quiz.passingScore;
  const timeSpent = Math.round(
    (Date.now() - new Date(attempt.started_at).getTime()) / 1000
  );

  // Update attempt
  await pool.query(
    `UPDATE quiz_attempts
     SET completed_at = NOW(), score = $1, passed = $2
     WHERE id = $3`,
    [Math.round(percentage), passed, attemptId]
  );

  return {
    attemptId,
    quizId: quiz.id,
    score: totalScore,
    totalPoints,
    percentage,
    passed,
    timeSpent,
    questionResults,
  };
}

/**
 * Get result for a completed attempt
 */
export async function getAttemptResult(attemptId: string): Promise<QuizResult | null> {
  const attemptResult = await pool.query(
    `SELECT * FROM quiz_attempts WHERE id = $1`,
    [attemptId]
  );

  if (attemptResult.rows.length === 0) return null;

  const attempt = attemptResult.rows[0];
  const quiz = await getQuizById(attempt.quiz_id);

  if (!quiz) return null;

  // Get saved answers
  const answersResult = await pool.query(
    `SELECT * FROM quiz_answers WHERE attempt_id = $1`,
    [attemptId]
  );

  let totalScore = 0;
  let totalPoints = 0;
  const questionResults: QuestionResult[] = [];

  for (const question of quiz.questions) {
    totalPoints += question.points;
    const savedAnswer = answersResult.rows.find(
      (a) => a.question_id === question.id
    );

    let userAnswer: string | string[] = '';
    let correctAnswer: string | string[] = '';

    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const correctOption = question.options?.find((o) => o.isCorrect);
      correctAnswer = correctOption?.text || '';
      const selectedOption = question.options?.find((o) =>
        savedAnswer?.selected_option_ids?.includes(o.id)
      );
      userAnswer = selectedOption?.text || '';
    } else if (question.type === 'multi-select') {
      const correctOptions = question.options?.filter((o) => o.isCorrect) || [];
      correctAnswer = correctOptions.map((o) => o.text);
      const selectedOptions =
        question.options?.filter((o) =>
          savedAnswer?.selected_option_ids?.includes(o.id)
        ) || [];
      userAnswer = selectedOptions.map((o) => o.text);
    } else if (question.type === 'short-answer') {
      correctAnswer = question.correctAnswer || '';
      userAnswer = savedAnswer?.text_answer || '';
    }

    if (savedAnswer?.is_correct) {
      totalScore += savedAnswer.points_earned;
    }

    questionResults.push({
      questionId: question.id,
      questionText: question.text,
      type: question.type,
      userAnswer,
      correctAnswer,
      isCorrect: savedAnswer?.is_correct || false,
      pointsEarned: savedAnswer?.points_earned || 0,
      pointsPossible: question.points,
      explanation: question.explanation,
    });
  }

  const percentage = attempt.score || 0;
  const timeSpent = attempt.completed_at
    ? Math.round(
        (new Date(attempt.completed_at).getTime() -
          new Date(attempt.started_at).getTime()) /
          1000
      )
    : 0;

  return {
    attemptId,
    quizId: quiz.id,
    score: totalScore,
    totalPoints,
    percentage,
    passed: attempt.passed,
    timeSpent,
    questionResults,
  };
}
