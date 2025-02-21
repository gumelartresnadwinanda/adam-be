-- Add deleted_at column for soft deletion
ALTER TABLE users
ADD COLUMN deleted_at TIMESTAMP;
