-- Add keyword column to notifications table with default empty string
ALTER TABLE notification
ADD COLUMN keyword character varying DEFAULT '';

-- Update existing notifications to have empty keyword
UPDATE notification SET keyword = '' WHERE keyword IS NULL;