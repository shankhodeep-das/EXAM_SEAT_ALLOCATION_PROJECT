-- CreateTable
CREATE TABLE "Building" (
    "id" SERIAL NOT NULL,
    "buildingCode" TEXT NOT NULL,
    "buildingName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "totalColumns" INTEGER NOT NULL,
    "buildingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomSeat" (
    "id" SERIAL NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "columnNumber" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,

    CONSTRAINT "RoomSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRoom" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "specialSeatCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" SERIAL NOT NULL,
    "examName" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Building_buildingCode_key" ON "Building"("buildingCode");

-- CreateIndex
CREATE INDEX "Room_buildingId_idx" ON "Room"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_buildingId_roomNumber_key" ON "Room"("buildingId", "roomNumber");

-- CreateIndex
CREATE INDEX "RoomSeat_roomId_idx" ON "RoomSeat"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomSeat_roomId_seatNumber_key" ON "RoomSeat"("roomId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RoomSeat_roomId_rowNumber_columnNumber_key" ON "RoomSeat"("roomId", "rowNumber", "columnNumber");

-- CreateIndex
CREATE INDEX "ExamRoom_roomId_idx" ON "ExamRoom"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoom_examId_roomId_key" ON "ExamRoom"("examId", "roomId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomSeat" ADD CONSTRAINT "RoomSeat_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRoom" ADD CONSTRAINT "ExamRoom_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRoom" ADD CONSTRAINT "ExamRoom_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
