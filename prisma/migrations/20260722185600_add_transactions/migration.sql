-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "usdAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "productName" TEXT,
    "code" TEXT,
    "chargeId" TEXT,
    "network" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);
