/*
  Warnings:

  - You are about to drop the column `originId` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `pay` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `system` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `wallet` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `DeliveredAmount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `originId` to the `CargoLine` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CargoStatus" AS ENUM ('PENDING', 'LOADED', 'DELIVERED');

-- DropForeignKey
ALTER TABLE "DeliveredAmount" DROP CONSTRAINT "DeliveredAmount_cargoLineId_fkey";

-- DropForeignKey
ALTER TABLE "Mission" DROP CONSTRAINT "Mission_originId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- AlterTable
ALTER TABLE "CargoLine" ADD COLUMN     "originId" INTEGER NOT NULL,
ADD COLUMN     "status" "CargoStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Mission" DROP COLUMN "originId",
DROP COLUMN "pay",
DROP COLUMN "system";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "wallet";

-- DropTable
DROP TABLE "DeliveredAmount";

-- DropTable
DROP TABLE "Transaction";

-- AddForeignKey
ALTER TABLE "CargoLine" ADD CONSTRAINT "CargoLine_originId_fkey" FOREIGN KEY ("originId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
