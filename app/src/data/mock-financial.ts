// Mock financial data for placeholder UI

import type { Invoice, Payment } from '@/types/financial'

export const mockInvoices: Invoice[] = [
  { id: 'inv-001', studentId: 'stu-001', invoiceNumber: 'INV-2022-0001', tuitionFee: 4465.20, lessAmount: 0, amountOutstanding: 0, status: 'paid', dueDate: '2022-10-31', programmeSemester: 'Sem 1 2022/23', issuedAt: '2022-09-01' },
  { id: 'inv-002', studentId: 'stu-001', invoiceNumber: 'INV-2023-0001', tuitionFee: 4465.20, lessAmount: 0, amountOutstanding: 0, status: 'paid', dueDate: '2023-04-30', programmeSemester: 'Sem 2 2022/23', issuedAt: '2023-03-01' },
  { id: 'inv-003', studentId: 'stu-001', invoiceNumber: 'INV-2023-0002', tuitionFee: 4465.20, lessAmount: 0, amountOutstanding: 1580.00, status: 'partial', dueDate: '2023-11-30', programmeSemester: 'Sem 1 2023/24', issuedAt: '2023-09-01' },
]

export const mockPayments: Payment[] = [
  { id: 'pay-001', invoiceId: 'inv-003', transactionNumber: 'TXN-20231015-001', amount: 2885.20, paymentDate: '2023-10-15', mode: 'online', referenceNo: 'FPX-20231015-88899', status: 'completed' },
]
