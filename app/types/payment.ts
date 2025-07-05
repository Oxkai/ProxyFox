export interface PaymentData {
  payer: string
  recipient: string
  amount: string
  asset: string
  signature: string
  transactionHash: string
  blockNumber: number
  status: string
  timestamp: string
}
