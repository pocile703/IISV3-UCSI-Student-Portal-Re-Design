// Financial types

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMode = 'transfer' | 'online' | 'cash' | 'card' | 'other'

export interface Invoice {
  id: string
  studentId: string
  invoiceNumber: string
  tuitionFee: number
  lessAmount: number
  /** Mock-era only: computed as tuitionFee − lessAmount − paid.
   *  Phase 4: NOT a Prisma column — derive at query time via Payment._sum aggregate. */
  amountOutstanding: number
  status: InvoiceStatus
  dueDate: string
  programmeSemester: string
  issuedAt: string
}

export interface Payment {
  id: string
  invoiceId: string
  transactionNumber: string
  amount: number
  paymentDate: string
  mode: PaymentMode
  referenceNo?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
}
