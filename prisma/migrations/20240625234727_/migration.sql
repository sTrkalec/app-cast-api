/*
  Warnings:

  - The `status` column on the `Schedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "STATUS_SCHEDULE" AS ENUM ('DISPONIVEL', 'OCUPADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "status",
ADD COLUMN     "status" "STATUS_SCHEDULE" NOT NULL DEFAULT 'DISPONIVEL';
