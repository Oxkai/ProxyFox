import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/app/utils/payment/verifyPayment'
import { PAYMENT_CONFIG } from '@/app/utils/payment/config'

export async function GET(req: NextRequest) {
  const xPayment = req.headers.get('x-payment')

  if (!xPayment) {
    return NextResponse.json(
      {
        message: 'Payment Required',
        recipient: PAYMENT_CONFIG.recipient,
        amount: `${PAYMENT_CONFIG.amount} FLOW`,
        payTo: PAYMENT_CONFIG.recipient,
        network: PAYMENT_CONFIG.network,
      },
      { status: 402 }
    )
  }

  try {
    const verifiedPayment = await verifyPayment(xPayment)

    return NextResponse.json({
      message: 'Payment verified. Access granted.',
      paymentData: verifiedPayment,
      protectedContent: '🔥 Your unlocked content.'
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        message: `Invalid payment — ${error}`,
        recipient: PAYMENT_CONFIG.recipient,
        amount: `${PAYMENT_CONFIG.amount} FLOW`,
        payTo: PAYMENT_CONFIG.recipient,
        network: PAYMENT_CONFIG.network,
      },
      { status: 402 }
    )
  }
}
