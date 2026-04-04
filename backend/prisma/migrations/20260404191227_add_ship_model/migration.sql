-- AlterTable
ALTER TABLE "User" ADD COLUMN     "selectedShipId" INTEGER;

-- CreateTable
CREATE TABLE "Ship" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "scu" INTEGER NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "Ship_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_selectedShipId_fkey" FOREIGN KEY ("selectedShipId") REFERENCES "Ship"("id") ON DELETE SET NULL ON UPDATE CASCADE;
