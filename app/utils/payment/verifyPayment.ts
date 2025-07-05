'use server'

import { JsonRpcProvider, formatEther } from 'ethers'
import { PAYMENT_CONFIG } from './config'
import { decodePaymentHeader } from './decodePaymentHeader'

const provider = new JsonRpcProvider(PAYMENT_CONFIG.rpcUrl)

export async function verifyPayment(xPayment: string) {
  const paymentData = decodePaymentHeader(xPayment)

  if (paymentData.recipient.toLowerCase() !== PAYMENT_CONFIG.recipient.toLowerCase()) {
    throw 'Recipient mismatch.'
  }

  const paidAmount = parseFloat(paymentData.amount.split(' ')[0])
  const requiredAmount = parseFloat(PAYMENT_CONFIG.amount)
  if (paidAmount < requiredAmount) {
    throw `Amount too low. Sent: ${paidAmount} FLOW`
  }

  const tx = await provider.getTransaction(paymentData.transactionHash)
  if (!tx) throw 'Transaction not found on-chain.'

  if (tx.to?.toLowerCase() !== PAYMENT_CONFIG.recipient.toLowerCase()) {
    throw 'On-chain transaction recipient mismatch.'
  }

  const txValue = parseFloat(formatEther(tx.value))
  if (txValue < requiredAmount) {
    throw `On-chain payment too low: ${txValue} FLOW`
  }

  const receipt = await provider.getTransactionReceipt(paymentData.transactionHash)
  if (!receipt || receipt.status !== 1) {
    throw 'Transaction not confirmed or failed.'
  }

  return paymentData
}
