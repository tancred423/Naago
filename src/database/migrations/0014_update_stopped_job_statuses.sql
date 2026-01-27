UPDATE `news_queue` SET `status` = 'STOPPED_MISSING_PERMISSIONS' WHERE `error_message` = 'Missing Permissions';
UPDATE `news_queue` SET `status` = 'STOPPED_MISSING_ACCESS' WHERE `error_message` = 'Missing Access';
UPDATE `news_queue` SET `status` = 'STOPPED_UNKNOWN_CHANNEL' WHERE `error_message` = 'Unknown Channel';
UPDATE `news_queue` SET `status` = 'STOPPED_UNKNOWN_GUILD' WHERE `error_message` = 'Unknown Guild';
