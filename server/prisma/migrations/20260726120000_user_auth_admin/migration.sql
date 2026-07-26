-- Clear legacy nickname-only users
DELETE FROM `Message`;
DELETE FROM `User`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `email` VARCHAR(191) NOT NULL;
ALTER TABLE `User` ADD COLUMN `passwordHash` VARCHAR(191) NOT NULL;
ALTER TABLE `User` ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);
