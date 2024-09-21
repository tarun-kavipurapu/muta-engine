-- CreateTable
CREATE TABLE "ApiUsageLog" (
    "id" SERIAL NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "ipAddress" TEXT NOT NULL,

    CONSTRAINT "ApiUsageLog_pkey" PRIMARY KEY ("id")
);
