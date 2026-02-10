/**
 * QuizPlayer Component - Interactive quiz taking
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { Quiz, Question, QuizAnswer } from '../types';
import styles from './QuizPlayer.module.css';

interface QuizPlayerProps {
  quiz: Quiz;
  answers: Record<string, QuizAnswer>;
  onAnswer: (questionId: string, answer: QuizAnswer) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  timeRemaining?: number; // seconds
  loading?: boolean;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  answers,
  onAnswer,
  onSubmit,
  onCancel,
  timeRemaining,
  loading = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const questions = quiz.shuffleQuestions
    ? [...quiz.questions].sort(() => Math.random() - 0.5)
    : quiz.questions;

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const canSubmit = answeredCount > 0;

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle option selection
  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (!currentQuestion) return;

      if (currentQuestion.type === 'multi-select') {
        const current = answers[currentQuestion.id]?.selectedOptionIds || [];
        const updated = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];

        onAnswer(currentQuestion.id, {
          questionId: currentQuestion.id,
          selectedOptionIds: updated,
          points: currentQuestion.points,
        });
      } else {
        onAnswer(currentQuestion.id, {
          questionId: currentQuestion.id,
          selectedOptionIds: [optionId],
          points: currentQuestion.points,
        });
      }
    },
    [currentQuestion, answers, onAnswer]
  );

  // Handle text answer
  const handleTextAnswer = useCallback(
    (text: string) => {
      if (!currentQuestion) return;

      onAnswer(currentQuestion.id, {
        questionId: currentQuestion.id,
        textAnswer: text,
        points: currentQuestion.points,
      });
    },
    [currentQuestion, onAnswer]
  );

  // Navigation
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleGoToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  // Submit
  const handleSubmitClick = () => {
    if (answeredCount < totalQuestions) {
      setShowConfirmSubmit(true);
    } else {
      onSubmit();
    }
  };

  const confirmSubmit = () => {
    setShowConfirmSubmit(false);
    onSubmit();
  };

  // Render question based on type
  const renderQuestion = (question: Question) => {
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return (
          <div className={styles.options}>
            {question.options?.map((option) => (
              <button
                key={option.id}
                className={`${styles.option} ${
                  currentAnswer?.selectedOptionIds?.includes(option.id) ? styles.selected : ''
                }`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <span className={styles.optionIndicator}>
                  {currentAnswer?.selectedOptionIds?.includes(option.id) ? '●' : '○'}
                </span>
                <span className={styles.optionText}>{option.text}</span>
              </button>
            ))}
          </div>
        );

      case 'multi-select':
        return (
          <div className={styles.options}>
            <p className={styles.hint}>Select all that apply</p>
            {question.options?.map((option) => (
              <button
                key={option.id}
                className={`${styles.option} ${
                  currentAnswer?.selectedOptionIds?.includes(option.id) ? styles.selected : ''
                }`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <span className={styles.optionIndicator}>
                  {currentAnswer?.selectedOptionIds?.includes(option.id) ? '☑' : '☐'}
                </span>
                <span className={styles.optionText}>{option.text}</span>
              </button>
            ))}
          </div>
        );

      case 'short-answer':
        return (
          <div className={styles.textAnswer}>
            <textarea
              className={styles.textInput}
              value={currentAnswer?.textAnswer || ''}
              onChange={(e) => handleTextAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={4}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h2 className={styles.title}>{quiz.title}</h2>
        <div className={styles.meta}>
          <span className={styles.progress}>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          {timeRemaining !== undefined && (
            <span
              className={`${styles.timer} ${timeRemaining < 60 ? styles.timerWarning : ''}`}
            >
              ⏱ {formatTime(timeRemaining)}
            </span>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question Navigation Dots */}
      <div className={styles.questionNav}>
        {questions.map((q, index) => (
          <button
            key={q.id}
            className={`${styles.navDot} ${index === currentIndex ? styles.current : ''} ${
              answers[q.id] ? styles.answered : ''
            }`}
            onClick={() => handleGoToQuestion(index)}
            title={`Question ${index + 1}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className={styles.questionCard}>
          <div className={styles.questionHeader}>
            <span className={styles.questionType}>
              {currentQuestion.type.replace('-', ' ')}
            </span>
            <span className={styles.points}>{currentQuestion.points} pts</span>
          </div>
          <h3 className={styles.questionText}>{currentQuestion.text}</h3>
          {renderQuestion(currentQuestion)}
        </div>
      )}

      {/* Navigation */}
      <footer className={styles.footer}>
        <div className={styles.navButtons}>
          <button
            className={styles.navButton}
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            ← Previous
          </button>

          {!isLastQuestion ? (
            <button className={styles.navButton} onClick={handleNext}>
              Next →
            </button>
          ) : (
            <button
              className={styles.submitButton}
              onClick={handleSubmitClick}
              disabled={!canSubmit || loading}
            >
              {loading ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>

        <div className={styles.footerMeta}>
          <span>
            {answeredCount}/{totalQuestions} answered
          </span>
          {onCancel && (
            <button className={styles.cancelButton} onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </footer>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Submit Quiz?</h3>
            <p>
              You have answered {answeredCount} of {totalQuestions} questions.
              {totalQuestions - answeredCount > 0 && (
                <strong> {totalQuestions - answeredCount} questions are unanswered.</strong>
              )}
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => setShowConfirmSubmit(false)}
              >
                Continue Quiz
              </button>
              <button className={styles.modalConfirm} onClick={confirmSubmit}>
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
