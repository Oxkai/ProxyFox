'use client'

import { useState } from 'react'
import { JsonRpcProvider, Wallet, parseEther, Block, TransactionReceipt } from 'ethers'

export default function PaymentPage() {
  const [response, setResponse] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const provider = new JsonRpcProvider('https://testnet.evm.nodes.onflow.org/')
  const privateKey = '0xd395aea4aa82b49e5ab9e31277ff6559431896b775bfc8e6dcd2de8ed2dfd21c'
  const wallet = new Wallet(privateKey, provider)

  const serverId = '61f1b4b7-d495-48dd-b333-f84bb4a09ab1-weather_broad'
  const toolName = 'weather'

  const encodePaymentHeader = (txInfo: any) => {
    const jsonStr = JSON.stringify(txInfo)
    const base64 = btoa(jsonStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    return base64
  }

  const makePayment = async (recipient: string, amountInEth: string) => {
    const payerAddress = await wallet.getAddress()

    const unsignedTx = {
      to: recipient,
      value: parseEther(amountInEth),
    }

    const signature = await wallet.signTransaction(unsignedTx)
    const txResponse = await wallet.sendTransaction(unsignedTx)
    const receipt: TransactionReceipt | null = await txResponse.wait()
    if (!receipt) throw new Error('Transaction receipt is null.')

    const block: Block | null = await provider.getBlock(receipt.blockNumber)
    if (!block) throw new Error('Block not found.')

    const timestamp = new Date(block.timestamp * 1000).toLocaleString()

    const txInfo = {
      payer: payerAddress,
      recipient,
      amount: `${amountInEth} FLOW`,
      asset: 'FLOW',
      signature,
      transactionHash: txResponse.hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? 'Success' : 'Failed',
      timestamp,
    }

    return txInfo
  }

  const makeSmartPostRequest = async () => {
    try {
      setLoading(true)
      setResponse('')

      const proxyUrl = `http://localhost:3000/api/proxy/${serverId}/${toolName}`
      const postBody = {
        tool: toolName,
        input: {
          text: 'Hello MCP!',
        },
      }

      let res = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postBody),
      })

      if (res.status === 402) {
        const paymentData = await res.json()

        if (!paymentData.recipient) throw new Error('Recipient missing in server response.')
        if (!paymentData.amount) throw new Error('Amount missing in server response.')

        const rawAmount = paymentData.amount.split(' ')[0]
        if (!rawAmount || isNaN(Number(rawAmount))) {
          throw new Error(`Invalid payment amount received: "${paymentData.amount}"`)
        }

        setResponse(`402 Payment Required.\n${JSON.stringify(paymentData, null, 2)}\n\nPaying now...`)

        const recipient = paymentData.recipient
        const amount = rawAmount

        const txInfo = await makePayment(recipient, amount)
        const paymentHeader = encodePaymentHeader(txInfo)

        res = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-payment': paymentHeader,
          },
          body: JSON.stringify(postBody),
        })

        const finalData = await res.json()

        setResponse(
          `✅ Paid successfully. Transaction: ${txInfo.transactionHash}\n\nFinal Response:\n${JSON.stringify(
            finalData,
            null,
            2
          )}`
        )
      } else {
        const normalData = await res.json()
        setResponse(`✅ Normal Response:\n${JSON.stringify(normalData, null, 2)}`)
      }
    } catch (error: any) {
      setResponse(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen  p-6 space-y-8">
      <button
        onClick={makeSmartPostRequest}
        disabled={loading}
        className={`px-6 py-3 text-white rounded-lg ${
          loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {loading ? 'Processing...' : 'Make Proxy POST Request'}
      </button>

      {response && (
        <pre className="mt-6 p-4 bg-black rounded-lg shadow-md text-sm w-full max-w-2xl overflow-x-auto text-green-400">
          {response}
        </pre>
      )}
    </div>
  )
}
