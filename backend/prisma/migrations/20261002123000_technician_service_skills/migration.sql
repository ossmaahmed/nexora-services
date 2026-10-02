CREATE TABLE `_TechnicianServices` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,
    UNIQUE INDEX `_TechnicianServices_AB_unique`(`A`, `B`),
    INDEX `_TechnicianServices_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `_TechnicianServices`
ADD CONSTRAINT `_TechnicianServices_A_fkey`
FOREIGN KEY (`A`) REFERENCES `Service`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `_TechnicianServices`
ADD CONSTRAINT `_TechnicianServices_B_fkey`
FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE `Request` SET `status` = 'In Progress' WHERE `status` = 'Approved';