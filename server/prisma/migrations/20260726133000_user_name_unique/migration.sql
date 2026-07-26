-- Resolve duplicate display names before unique index (keep oldest id per name).
UPDATE `User` u
INNER JOIN (
  SELECT `name`, MIN(`id`) AS keep_id
  FROM `User`
  GROUP BY `name`
  HAVING COUNT(*) > 1
) d ON u.`name` = d.`name` AND u.`id` <> d.keep_id
SET u.`name` = CONCAT(u.`name`, '_', RIGHT(u.`id`, 4));

CREATE UNIQUE INDEX `User_name_key` ON `User`(`name`);
