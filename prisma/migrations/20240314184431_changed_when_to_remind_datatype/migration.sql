/*
  Warnings:

  - Changed the type of `whenToRemind` on the `Enrollment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "whenToRemind",
ADD COLUMN     "whenToRemind" TIMESTAMP(3) NOT NULL;
