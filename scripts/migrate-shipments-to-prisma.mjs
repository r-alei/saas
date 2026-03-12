import { promises as fs } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const sourceFile = path.join(process.cwd(), "data", "shipments.json");

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeShipment(raw) {
  const paymentAmount = Number(raw.paymentAmount);
  return {
    id: Number(raw.id),
    driverName: normalizeText(raw.driverName),
    licensePlate: normalizeText(raw.licensePlate).toUpperCase(),
    driverPhone: normalizeText(raw.driverPhone),
    destination: normalizeText(raw.destination),
    waybillNumber: normalizeText(raw.waybillNumber).toUpperCase(),
    waybillType: normalizeText(raw.waybillType) || null,
    waybillDescription: normalizeText(raw.waybillDescription) || null,
    invoiceNumber: normalizeText(raw.invoiceNumber) || null,
    invoiceType: normalizeText(raw.invoiceType) || "e-fatura",
    invoiceDate: normalizeText(raw.invoiceDate),
    paymentDay: normalizeText(raw.paymentDay),
    paymentStatus: normalizeText(raw.paymentStatus) || "Bekliyor",
    bankName: normalizeText(raw.bankName),
    paymentAmount: Number.isFinite(paymentAmount) ? paymentAmount : null,
    iban: normalizeText(raw.iban) || null,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
  };
}

async function run() {
  const exists = await fs
    .access(sourceFile)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    console.log("Kaynak dosya bulunamadi:", sourceFile);
    return;
  }

  const raw = await fs.readFile(sourceFile, "utf8");
  const parsed = JSON.parse(raw);
  const rows = Array.isArray(parsed) ? parsed : [];

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const data = normalizeShipment(row);

    if (!data.driverName || !data.licensePlate || !data.waybillNumber || !data.invoiceDate) {
      skipped += 1;
      continue;
    }

    const existing = await prisma.shipment.findUnique({
      where: { waybillNumber: data.waybillNumber },
      select: { id: true },
    });

    if (!existing) {
      await prisma.shipment.create({ data });
      inserted += 1;
      continue;
    }

    await prisma.shipment.update({
      where: { id: existing.id },
      data: {
        driverName: data.driverName,
        licensePlate: data.licensePlate,
        driverPhone: data.driverPhone,
        destination: data.destination,
        waybillType: data.waybillType,
        waybillDescription: data.waybillDescription,
        invoiceNumber: data.invoiceNumber,
        invoiceType: data.invoiceType,
        invoiceDate: data.invoiceDate,
        paymentDay: data.paymentDay,
        paymentStatus: data.paymentStatus,
        bankName: data.bankName,
        paymentAmount: data.paymentAmount,
        iban: data.iban,
      },
    });
    updated += 1;
  }

  console.log(`Tamamlandi. Eklenen: ${inserted}, Guncellenen: ${updated}, Atlanan: ${skipped}`);
}

run()
  .catch((error) => {
    console.error("Migration hatasi:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
