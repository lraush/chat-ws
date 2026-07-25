-- AlterTable
ALTER TABLE `Message` ADD COLUMN `room` VARCHAR(191) NOT NULL DEFAULT 'general';

-- CreateIndex
CREATE INDEX `Message_room_idx` ON `Message`(`room`);
