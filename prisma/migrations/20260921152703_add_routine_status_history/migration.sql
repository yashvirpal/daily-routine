-- CreateTable
CREATE TABLE "RoutineStatusChange" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "changedAt" DATE NOT NULL,
    "routineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutineStatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoutineStatusChange_routineId_changedAt_idx" ON "RoutineStatusChange"("routineId", "changedAt");

-- AddForeignKey
ALTER TABLE "RoutineStatusChange" ADD CONSTRAINT "RoutineStatusChange_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
