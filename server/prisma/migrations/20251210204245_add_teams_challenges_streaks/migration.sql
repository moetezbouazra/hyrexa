/*
  Warnings:

  - You are about to drop the column `bonusPoints` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `targetCleanups` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `Team` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[identifier]` on the table `Achievement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdBy` to the `Challenge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Team` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable Achievement
ALTER TABLE "Achievement" ADD COLUMN "identifier" TEXT;

-- Update existing achievements with identifiers based on their names
UPDATE "Achievement" SET "identifier" = 'first-cleanup' WHERE "name" = 'First Cleanup';
UPDATE "Achievement" SET "identifier" = 'eco-warrior' WHERE "name" = 'Eco Warrior';
UPDATE "Achievement" SET "identifier" = 'planet-saver' WHERE "name" = 'Planet Saver';
UPDATE "Achievement" SET "identifier" = '100-club' WHERE "name" = '100 Club';
UPDATE "Achievement" SET "identifier" = 'community-leader' WHERE "name" = 'Community Leader';
UPDATE "Achievement" SET "identifier" = 'early-adopter' WHERE "name" = 'Early Adopter';

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_identifier_key" ON "Achievement"("identifier");

-- AlterTable Challenge
ALTER TABLE "Challenge" DROP COLUMN "bonusPoints";
ALTER TABLE "Challenge" DROP COLUMN "targetCleanups";
ALTER TABLE "Challenge" ADD COLUMN "pointsReward" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Challenge" ADD COLUMN "targetCount" INTEGER;
ALTER TABLE "Challenge" ALTER COLUMN "endDate" DROP NOT NULL;
ALTER TABLE "Challenge" ADD COLUMN "createdBy" TEXT;

-- Update existing challenges (if any) with a default user ID
UPDATE "Challenge" SET "createdBy" = (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' LIMIT 1) WHERE "createdBy" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "Challenge" ALTER COLUMN "createdBy" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Team
ALTER TABLE "Team" RENAME COLUMN "creatorId" TO "createdBy";
