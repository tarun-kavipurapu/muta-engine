/*
  Warnings:

  - You are about to drop the column `googleId` on the `users` table. All the data in the column will be lost.
  - Made the column `password` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AvailableSocialLogins" AS ENUM ('GOOGLE', 'EMAIL_PASSWORD');

-- DropIndex
DROP INDEX "users_googleId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "googleId",
ADD COLUMN     "loginType" "AvailableSocialLogins" NOT NULL DEFAULT 'EMAIL_PASSWORD',
ALTER COLUMN "password" SET NOT NULL;
