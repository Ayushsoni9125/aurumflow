-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED');

-- CreateTable
CREATE TABLE "loan_schemes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "annualInterestRate" DECIMAL(5,4) NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "maxLtv" DECIMAL(5,4) NOT NULL,
    "repaymentDescription" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "mobile_number" TEXT NOT NULL,
    "gross_weight_grams" DECIMAL(8,3) NOT NULL,
    "net_weight_grams" DECIMAL(8,3) NOT NULL,
    "karat" INTEGER NOT NULL,
    "scheme_id" TEXT NOT NULL,
    "pure_gold_grams" DECIMAL(10,4) NOT NULL,
    "gold_value_paise" BIGINT NOT NULL,
    "eligible_loan_paise" BIGINT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_application_id_key" ON "leads"("application_id");

-- CreateIndex
CREATE INDEX "leads_mobile_number_created_at_idx" ON "leads"("mobile_number", "created_at");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at" DESC);

-- CreateIndex
CREATE INDEX "leads_scheme_id_idx" ON "leads"("scheme_id");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "loan_schemes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
