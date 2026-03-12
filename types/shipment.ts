export type PaymentStatus = "Ödendi" | "Bekliyor";

export type InvoiceType = "e-fatura" | "e-arşiv";

export type Shipment = {
  id: number;
  driverName: string;
  licensePlate: string;
  driverPhone: string;
  destination: string;
  waybillNumber: string;
  waybillType?: string;
  waybillDescription?: string;
  invoiceNumber?: string;
  invoiceType?: InvoiceType;
  invoiceDate: string;
  paymentDay: string;
  paymentStatus: PaymentStatus;
  bankName: string;
  paymentAmount?: number;
  iban?: string;
  createdAt: string;
  updatedAt: string;
};

export type ShipmentInput = Omit<Shipment, "id" | "createdAt" | "updatedAt">;
