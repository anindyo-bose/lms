/**
 * Quiz Page - Quiz placeholder
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Question {
  id: string;
  question_text: string;
  options: { id: string; text: string }[];
}

export default function QuizPage() {
  const router = useRouter();
  const { id: quizId, course: courseId } = router.query;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (quizId && typeof quizId === 'string') {
      fetch(`http://localhost:3008/api/quizzes/${quizId}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data.questions) setQuestions(data.questions);
        })
        .catch(console.error);
    }
  }, [quizId]);

  const handleAnswer = (optionId: string) => {
    if (questions[currentIndex]) {
      setAnswers({ ...answers, [questions[currentIndex].id]: optionId });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = async () => {
    if (!quizId) return;
    try {
      const res = await fetch(`http://localhost:3008/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      setScore(data.percentage || 0);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => {
    if (courseId && typeof courseId === 'string') {
      router.push(`/courses/${courseId}`);
    } else {
      router.push('/courses');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header
        style={{
          padding: '12px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            href="/courses"
            style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            Courses
          </Link>
          <span style={{ color: '#d1d5db' }}>/</span>
          <span style={{ color: '#111827', fontSize: '0.875rem', fontWeight: 500 }}>
            Quiz
          </span>
        </nav>
        <button
          onClick={handleClose}
          style={{
            padding: '0.5rem 1rem',
            background: '#ffffff',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Exit Quiz
        </button>
      </header>

      <main style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>
        {submitted ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 16px' }}>Quiz Complete!</h2>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: score !== null && score >= 70 ? '#10b981' : '#ef4444' }}>
              {score}%
            </p>
            <p style={{ color: '#6b7280', marginTop: '16px' }}>
              {score !== null && score >= 70 ? 'Congratulations! You passed.' : 'Keep practicing!'}
            </p>
            <button
              onClick={handleClose}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Continue
            </button>
          </div>
        ) : questions.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <p>Loading quiz questions...</p>
          </div>
        ) : (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <p style={{ color: '#6b7280', marginBottom: '8px' }}>
              Question {currentIndex + 1} of {questions.length}
            </p>
            <h3 style={{ margin: '0 0 24px', color: '#111827' }}>
              {questions[currentIndex].question_text}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {questions[currentIndex].options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    background: answers[questions[currentIndex].id] === opt.id ? '#dbeafe' : '#f9fafb',
                    border: answers[questions[currentIndex].id] === opt.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  {opt.text}
                </button>
              ))}
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!answers[questions[currentIndex].id]}
                  style={{
                    padding: '12px 24px',
                    background: answers[questions[currentIndex].id] ? '#3b82f6' : '#9ca3af',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: answers[questions[currentIndex].id] ? 'pointer' : 'not-allowed',
                  }}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length !== questions.length}
                  style={{
                    padding: '12px 24px',
                    background: Object.keys(answers).length === questions.length ? '#10b981' : '#9ca3af',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: Object.keys(answers).length === questions.length ? 'pointer' : 'not-allowed',
                  }}
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
