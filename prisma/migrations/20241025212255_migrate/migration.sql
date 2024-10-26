/*
  Warnings:

  - Added the required column `gender` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GENDER" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO');

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "gender" "GENDER" NOT NULL;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "gender" "GENDER" NOT NULL;
