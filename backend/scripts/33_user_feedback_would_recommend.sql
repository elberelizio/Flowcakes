-- Optional "would recommend" flag on satisfaction surveys

ALTER TABLE user_feedback
  ADD COLUMN IF NOT EXISTS would_recommend BOOLEAN;

COMMENT ON COLUMN user_feedback.would_recommend IS 'Whether the user would recommend Chef Control (null = not answered).';
