-- ============================================================
--  Migration: Add Schedule table
--  Run this if you prefer manual SQL over prisma migrate:
--    mysql -u root -p school_management < migration_add_schedule.sql
--
--  OR use Prisma (recommended):
--    cd backend
--    npx prisma migrate dev --name add_schedule
-- ============================================================

CREATE TABLE IF NOT EXISTS `Schedule` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `courseId`  INT          NOT NULL,
  `teacherId` INT          NULL,
  `dayOfWeek` INT          NOT NULL COMMENT '0=Даваа 1=Мягмар 2=Лхагва 3=Пүрэв 4=Баасан',
  `startTime` VARCHAR(10)  NOT NULL COMMENT 'HH:MM format e.g. 08:00',
  `endTime`   VARCHAR(10)  NOT NULL COMMENT 'HH:MM format e.g. 09:40',
  `room`      VARCHAR(100) NULL,
  `semester`  VARCHAR(20)  NOT NULL,
  `year`      INT          NOT NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_schedule_slot` (`courseId`, `dayOfWeek`, `startTime`, `semester`, `year`),
  KEY `idx_schedule_semester` (`semester`, `year`),
  KEY `idx_schedule_course`   (`courseId`),

  CONSTRAINT `fk_schedule_course`
    FOREIGN KEY (`courseId`)  REFERENCES `Course`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_schedule_teacher`
    FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
