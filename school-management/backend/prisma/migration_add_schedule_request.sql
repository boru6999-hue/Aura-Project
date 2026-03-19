-- ============================================================
--  Migration: Add ScheduleRequest table
--  Run:  mysql -u root -p school_management < prisma/migration_add_schedule_request.sql
--  OR:   npx prisma db push
-- ============================================================

CREATE TABLE IF NOT EXISTS `ScheduleRequest` (
  `id`           INT           NOT NULL AUTO_INCREMENT,
  `scheduleId`   INT           NULL,
  `teacherId`    INT           NOT NULL,
  `courseId`     INT           NOT NULL,
  `dayOfWeek`    INT           NOT NULL,
  `startTime`    VARCHAR(10)   NOT NULL,
  `endTime`      VARCHAR(10)   NOT NULL,
  `room`         VARCHAR(100)  NULL,
  `semester`     VARCHAR(20)   NOT NULL,
  `year`         INT           NOT NULL,
  `oldDayOfWeek` INT           NULL,
  `oldStartTime` VARCHAR(10)   NULL,
  `oldEndTime`   VARCHAR(10)   NULL,
  `oldRoom`      VARCHAR(100)  NULL,
  `status`       VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
  `note`         TEXT          NULL,
  `adminNote`    TEXT          NULL,
  `reviewedAt`   DATETIME(3)   NULL,
  `createdAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `idx_sreq_status`    (`status`),
  KEY `idx_sreq_teacher`   (`teacherId`),

  CONSTRAINT `fk_sreq_schedule` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sreq_teacher`  FOREIGN KEY (`teacherId`)  REFERENCES `Teacher`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_sreq_course`   FOREIGN KEY (`courseId`)   REFERENCES `Course`(`id`)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
