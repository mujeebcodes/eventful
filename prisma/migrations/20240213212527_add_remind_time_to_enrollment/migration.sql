/*
  Warnings:

  - Added the required column `whenToRemind` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `enrollment` ADD COLUMN `whenToRemind` VARCHAR(191) NOT NULL;
