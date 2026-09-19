-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Frequency" ADD VALUE 'MONTHLY';
ALTER TYPE "Frequency" ADD VALUE 'ONCE';

-- AlterTable
ALTER TABLE "Routine" ADD COLUMN     "daysOfMonth" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "monthlyWeekOrdinal" INTEGER,
ADD COLUMN     "monthlyWeekday" INTEGER,
ADD COLUMN     "onceDate" DATE;
