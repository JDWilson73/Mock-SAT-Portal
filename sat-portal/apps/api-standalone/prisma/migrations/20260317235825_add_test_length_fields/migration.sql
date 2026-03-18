-- AlterTable
ALTER TABLE "TestSession" ADD COLUMN     "mathTimeLimitSeconds" INTEGER NOT NULL DEFAULT 4200,
ADD COLUMN     "rwTimeLimitSeconds" INTEGER NOT NULL DEFAULT 3840,
ADD COLUMN     "testLength" TEXT NOT NULL DEFAULT 'full';
