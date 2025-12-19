ALTER TABLE `topic_data` ADD `description_v2` json AFTER `description`;
ALTER TABLE `notice_data` ADD `description_v2` json AFTER `description`;
ALTER TABLE `maintenance_data` ADD `description_v2` json AFTER `description`;
ALTER TABLE `update_data` ADD `description_v2` json AFTER `description`;
ALTER TABLE `status_data` ADD `description_v2` json AFTER `description`;
