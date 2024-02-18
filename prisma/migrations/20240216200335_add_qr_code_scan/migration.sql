/*
  Warnings:

  - Added the required column `QRCodeScanned` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `enrollment` ADD COLUMN `QRCodeScanned` BOOLEAN NOT NULL;
