-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lecturerId" UUID NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "context" VARCHAR(200),
    "dueDate" DATE,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_lecturerId_isDone_idx" ON "Task"("lecturerId", "isDone");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
