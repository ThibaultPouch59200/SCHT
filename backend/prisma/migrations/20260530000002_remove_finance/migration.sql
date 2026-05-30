-- DropTable: Transaction (finance feature removed in v2)
DROP TABLE IF EXISTS "Transaction";

-- AlterTable: remove wallet column from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "wallet";
