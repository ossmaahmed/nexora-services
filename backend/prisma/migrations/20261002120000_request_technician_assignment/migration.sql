ALTER TABLE `Request`
ADD COLUMN `technicianId` INTEGER NULL;

CREATE INDEX `Request_technicianId_idx` ON `Request`(`technicianId`);

ALTER TABLE `Request`
ADD CONSTRAINT `Request_technicianId_fkey`
FOREIGN KEY (`technicianId`) REFERENCES `User`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;