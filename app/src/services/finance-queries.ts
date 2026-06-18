// Server-only Prisma queries for the Finance page.
import { prisma } from '@/lib/prisma'
import type { Invoice, Payment } from '@/types/financial'

export async function getFinanceData(studentId: string): Promise<{
  invoices: Invoice[]
  payments: Payment[]
}> {
  const rows = await prisma.invoice.findMany({
    where: { studentId },
    select: {
      id: true,
      studentId: true,
      invoiceNumber: true,
      tuitionFee: true,
      lessAmount: true,
      status: true,
      dueDate: true,
      programmeSemester: true,
      issuedAt: true,
      payments: {
        select: {
          id: true,
          invoiceId: true,
          transactionNumber: true,
          amount: true,
          paymentDate: true,
          mode: true,
          referenceNo: true,
          status: true,
        },
        orderBy: { paymentDate: 'desc' },
      },
    },
    orderBy: { issuedAt: 'desc' },
  })

  if (rows.length === 0) return { invoices: [], payments: [] }

  const invoices: Invoice[] = rows.map((inv) => {
    const paidSum = inv.payments.reduce(
      (sum, payment) => sum + (payment.status === 'COMPLETED' ? Number(payment.amount) : 0),
      0,
    )
    const amountOutstanding = Math.max(
      0,
      Number(inv.tuitionFee) - Number(inv.lessAmount) - paidSum,
    )
    return {
      id: inv.id,
      studentId: inv.studentId,
      invoiceNumber: inv.invoiceNumber,
      tuitionFee: Number(inv.tuitionFee),
      lessAmount: Number(inv.lessAmount),
      amountOutstanding,
      status: inv.status.toLowerCase() as Invoice['status'],
      dueDate: inv.dueDate.toISOString().split('T')[0],
      programmeSemester: inv.programmeSemester,
      issuedAt: inv.issuedAt.toISOString().split('T')[0],
    }
  })

  const payments: Payment[] = rows
    .flatMap((inv) =>
      inv.payments.map((p) => ({
        id: p.id,
        invoiceId: p.invoiceId,
        transactionNumber: p.transactionNumber,
        amount: Number(p.amount),
        paymentDate: p.paymentDate.toISOString().split('T')[0],
        mode: p.mode.toLowerCase() as Payment['mode'],
        referenceNo: p.referenceNo ?? undefined,
        status: p.status.toLowerCase() as Payment['status'],
      }))
    )
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))

  return { invoices, payments }
}
