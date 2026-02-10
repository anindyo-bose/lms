-- Migration: Add quiz attempts, answers, achievements, and learning activities tables
-- For MODULE 2: LMS Core Widgets

-- Add show_results column to quizzes
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS show_results BOOLEAN DEFAULT true;

-- Quiz Attempts Table (replaces quiz_submissions for better flow)
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL,
  user_id UUID NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  score INTEGER,
  passed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);

-- Quiz Answers Table (individual question answers)
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL,
  question_id UUID NOT NULL,
  selected_option_ids UUID[],
  text_answer TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON quiz_answers(attempt_id);

-- Question Options Table (for multi-select and radio options)
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);

-- Update quiz_questions to use separate options table
ALTER TABLE quiz_questions 
  ADD COLUMN IF NOT EXISTS text TEXT,
  ADD COLUMN IF NOT EXISTS type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1;

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '🏆',
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(type);

-- Learning Activities Table
CREATE TABLE IF NOT EXISTS learning_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  course_id UUID,
  lesson_id UUID,
  quiz_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_activities_user ON learning_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_created ON learning_activities(created_at);

-- Add thumbnail_url and video_url to lessons
ALTER TABLE lessons 
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add completed_at to enrollments
ALTER TABLE enrollments 
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Add published column to lessons if it doesn't exist (rename from is_published)
ALTER TABLE lessons 
  ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

-- Rename lesson_order to order for consistency
-- (Skip if column doesn't exist, some DBs don't support IF EXISTS for rename)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'lessons' AND column_name = 'lesson_order') THEN
    ALTER TABLE lessons RENAME COLUMN lesson_order TO "order";
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Add user_id alias for lesson_progress
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'lesson_progress' AND column_name = 'user_id') THEN
    ALTER TABLE lesson_progress ADD COLUMN user_id UUID;
    UPDATE lesson_progress SET user_id = student_id WHERE user_id IS NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
