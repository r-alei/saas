"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { Shipment, ShipmentInput } from "@/types/shipment";

function normalizeText(value: string) {
  return value.trim();
}

function validateInput(input: ShipmentInput) {
  const required: Array<[string, string]> = [
    ["driverName", input.driverName],
    ["licensePlate", input.licensePlate],
    ["driverPhone", input.driverPhone],
    ["destination", input.destination],
    ["invoiceDate", input.invoiceDate],
  ];

  const missing = required.find(([, value]) => !normalizeText(String(value || "")));
  if (missing) {
    throw new Error(`Zorunlu alan bos birakilamaz: ${missing[0]}`);
  }
}

function sanitizeInput(input: ShipmentInput): ShipmentInput {
  return {
    driverName: normalizeText(input.driverName),
    licensePlate: normalizeText(input.licensePlate).toUpperCase(),
    driverPhone: normalizeText(input.driverPhone),
    destination: normalizeText(input.destination),
    waybillNumber: normalizeText(input.waybillNumber).toUpperCase(),
    waybillType: normalizeText(input.waybillType || "") || undefined,
    waybillDescription: normalizeText(input.waybillDescription || "") || undefined,
    invoiceNumber: normalizeText(input.invoiceNumber || "") || undefined,
    invoiceType: input.invoiceType || "e-fatura",
    invoiceDate: input.invoiceDate,
    paymentDay: input.paymentDay || "",
    paymentStatus: input.paymentStatus,
    bankName: normalizeText(input.bankName),
    paymentAmount: typeof input.paymentAmount === "number" && Number.isFinite(input.paymentAmount)
      ? input.paymentAmount
      : undefined,
    iban: normalizeText(input.iban || "") || undefined,
  };
}

function mapRecord(record: {
  id: number;
  driverName: string;
  licensePlate: string;
  driverPhone: string;
  destination: string;
  waybillNumber: string | null;
  waybillType: string | null;
  waybillDescription: string | null;
  invoiceNumber: string | null;
  invoiceType: string;
  invoiceDate: string;
  paymentDay: string;
  paymentStatus: string;
  bankName: string;
  paymentAmount: number | null;
  iban: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Shipment {
  return {
    id: record.id,
    driverName: record.driverName,
    licensePlate: record.licensePlate,
    driverPhone: record.driverPhone,
    destination: record.destination,
    waybillNumber: record.waybillNumber || "",
    waybillType: record.waybillType || undefined,
    waybillDescription: record.waybillDescription || undefined,
    invoiceNumber: record.invoiceNumber || undefined,
    invoiceType: record.invoiceType as ShipmentInput["invoiceType"],
    invoiceDate: record.invoiceDate,
    paymentDay: record.paymentDay,
    paymentStatus: record.paymentStatus as ShipmentInput["paymentStatus"],
    bankName: record.bankName,
    paymentAmount: record.paymentAmount ?? undefined,
    iban: record.iban || undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function translatePrismaError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new Error("Bu irsaliye numarasi zaten kayitli.");
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error("Beklenmeyen bir hata olustu.");
}

type ListShipmentOptions = {
  search?: string;
  status?: Shipment["paymentStatus"] | "all" | "overdue";
  page?: number;
  pageSize?: number;
};

type ShipmentSummary = {
  totalCount: number;
  waitingCount: number;
  paidCount: number;
  overdueCount: number;
  paidAmountTotal: number;
};

type ListShipmentResult = {
  items: Shipment[];
  totalCount: number;
  page: number;
  pageSize: number;
  summary: ShipmentSummary;
};

function isInvoiceOverdue(invoiceDate: string, todayISO: string) {
  const date = new Date(`${invoiceDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  date.setDate(date.getDate() + 5);
  return date.toISOString().slice(0, 10) < todayISO;
}

async function getShipmentSummary(): Promise<ShipmentSummary> {
  const todayISO = new Date().toISOString().slice(0, 10);

  const [totalCount, waitingCount, paidAmountAgg, waitingDates] = await Promise.all([
    prisma.shipment.count(),
    prisma.shipment.count({ where: { paymentStatus: "Bekliyor" } }),
    prisma.shipment.aggregate({
      where: { paymentStatus: "Ödendi" },
      _sum: { paymentAmount: true },
    }),
    prisma.shipment.findMany({
      where: { paymentStatus: "Bekliyor" },
      select: { invoiceDate: true },
    }),
  ]);

  const overdueCount = waitingDates.reduce((count, row) => {
    return count + (isInvoiceOverdue(row.invoiceDate, todayISO) ? 1 : 0);
  }, 0);

  return {
    totalCount,
    waitingCount,
    paidCount: totalCount - waitingCount,
    overdueCount,
    paidAmountTotal: paidAmountAgg._sum.paymentAmount || 0,
  };
}

export async function listShipments(options: ListShipmentOptions = {}): Promise<ListShipmentResult> {
  const pageSize = Math.min(Math.max(options.pageSize || 50, 1), 200);
  const page = Math.max(options.page || 1, 1);
  const q = normalizeText(options.search || "");
  const todayISO = new Date().toISOString().slice(0, 10);

  const baseWhere: Prisma.ShipmentWhereInput = {
    ...(q
      ? {
        OR: [
          { driverName: { contains: q } },
          { licensePlate: { contains: q } },
          { destination: { contains: q } },
          { waybillNumber: { contains: q } },
          { waybillType: { contains: q } },
          { waybillDescription: { contains: q } },
          { bankName: { contains: q } },
        ],
      }
      : {}),
  };

  const summaryPromise = getShipmentSummary();

  if (options.status === "overdue") {
    const waitingRecords = await prisma.shipment.findMany({
      where: { ...baseWhere, paymentStatus: "Bekliyor" },
      orderBy: [{ createdAt: "desc" }],
    });

    const overdueRecords = waitingRecords.filter((record) => isInvoiceOverdue(record.invoiceDate, todayISO));
    const totalCount = overdueRecords.length;
    const start = (page - 1) * pageSize;
    const items = overdueRecords.slice(start, start + pageSize).map(mapRecord);

    return {
      items,
      totalCount,
      page,
      pageSize,
      summary: await summaryPromise,
    };
  }

  const where: Prisma.ShipmentWhereInput = {
    ...baseWhere,
    ...(options.status && options.status !== "all" ? { paymentStatus: options.status } : {}),
  };

  const [totalCount, records, summary] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({
      where,
      orderBy: [{ paymentStatus: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    summaryPromise,
  ]);

  return {
    items: records.map(mapRecord),
    totalCount,
    page,
    pageSize,
    summary,
  };
}

export async function createShipment(payload: ShipmentInput) {
  validateInput(payload);
  const input = sanitizeInput(payload);

  try {
    const created = await prisma.shipment.create({
      data: {
        ...input,
        waybillNumber: input.waybillNumber || null,
        waybillType: input.waybillType || null,
        waybillDescription: input.waybillDescription || null,
        invoiceNumber: input.invoiceNumber || null,
        paymentDay: input.paymentDay || "",
        paymentAmount: input.paymentAmount ?? null,
        iban: input.iban || null,
      },
    });

    return mapRecord(created);
  } catch (error) {
    return translatePrismaError(error);
  }
}

export async function updateShipment(id: number, patch: Partial<ShipmentInput>) {
  const current = await prisma.shipment.findUnique({ where: { id } });
  if (!current) {
    throw new Error("Nakliye kaydi bulunamadi.");
  }

  const merged: ShipmentInput = sanitizeInput({
    ...mapRecord(current),
    ...patch,
    paymentStatus: (patch.paymentStatus || current.paymentStatus) as ShipmentInput["paymentStatus"],
  });

  validateInput(merged);

  try {
    const updated = await prisma.shipment.update({
      where: { id },
      data: {
        ...merged,
        waybillNumber: merged.waybillNumber || null,
        waybillType: merged.waybillType || null,
        waybillDescription: merged.waybillDescription || null,
        invoiceNumber: merged.invoiceNumber || null,
        paymentDay: merged.paymentDay || "",
        paymentAmount: merged.paymentAmount ?? null,
        iban: merged.iban || null,
      },
    });

    return mapRecord(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Bu irsaliye numarasi baska bir kayitta kullaniliyor.");
    }
    return translatePrismaError(error);
  }
}

export async function deleteShipment(id: number) {
  try {
    await prisma.shipment.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error("Silinecek nakliye kaydi bulunamadi.");
    }
    return translatePrismaError(error);
  }
}
