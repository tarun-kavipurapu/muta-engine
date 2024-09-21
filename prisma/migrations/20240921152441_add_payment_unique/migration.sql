/*
  Warnings:

  - A unique constraint covering the columns `[paymentId]` on the table `EcomOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EcomOrder_paymentId_key" ON "EcomOrder"("paymentId");
