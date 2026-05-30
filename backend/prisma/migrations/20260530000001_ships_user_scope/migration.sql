-- AlterTable: add userId to Ship (nullable to not break existing data)
ALTER TABLE "Ship" ADD COLUMN "userId" INTEGER;

-- AddForeignKey: Ship → User
ALTER TABLE "Ship" ADD CONSTRAINT "Ship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropForeignKey: ContractShip → Ship (recreate with CASCADE)
ALTER TABLE "ContractShip" DROP CONSTRAINT "ContractShip_shipId_fkey";

-- AddForeignKey: ContractShip → Ship with CASCADE
ALTER TABLE "ContractShip" ADD CONSTRAINT "ContractShip_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "Ship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
