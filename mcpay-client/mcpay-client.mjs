#!/usr/bin/env node

import { JsonRpcProvider, Wallet, parseEther } from 'ethers'
import fetch from 'node-fetch'
import { program } from 'commander'

// Accept proxyUrl and privateKey via CLI
program
  .requiredOption('--proxyUrl <string>', 'Full MCP Proxy URL (with serverId/toolName)')
  .requiredOption('--privateKey <string>', 'Wallet private key')

program.parse(process.argv)
const { proxyUrl, privateKey } = program.opts()

// Setup provider and wallet
const rpcUrl = 'https://testnet.evm.nodes.onflow.org/'
const provider = new JsonRpcProvider(rpcUrl)
const wallet = new Wallet(privateKey, provider)

// Encode transaction data as base64url
const encodePaymentHeader = (txInfo) => {
  const jsonStr = JSON.stringify(txInfo)
  return Buffer.from(jsonStr).toString('base64url')
}

// Make payment if required
const makePayment = async (recipient, amountInEth) => {
  const payerAddress = await wallet.getAddress()

  const unsignedTx = {
    to: recipient,
    value: parseEther(amountInEth),
  }

  const signature = await wallet.signTransaction(unsignedTx)
  const txResponse = await wallet.sendTransaction(unsignedTx)
  const receipt = await txResponse.wait()

  if (!receipt) throw new Error('Transaction receipt is null.')
  const block = await provider.getBlock(receipt.blockNumber)
  if (!block) throw new Error('Block not found.')

  const timestamp = new Date(block.timestamp * 1000).toLocaleString()

  return {
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
}

// Read stdin JSON and run request
const makeSmartPostRequest = async () => {
  const inputChunks = []
  for await (const chunk of process.stdin) {
    inputChunks.push(chunk)
  }
  const postBodyStr = Buffer.concat(inputChunks).toString()
  const postBody = JSON.parse(postBodyStr)

  console.log(`➡️  Sending POST to ${proxyUrl} with payload:`)
  console.log(JSON.stringify(postBody, null, 2))

  let res = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postBody),
  })

  const tryParseJson = async (res) => {
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await res.json()
    } else {
      const rawText = await res.text()
      throw new Error(`Unexpected response:\n${rawText}`)
    }
  }

  if (res.status === 402) {
    const paymentData = await tryParseJson(res)
    const rawAmount = paymentData.amount?.split(' ')[0]

    if (!paymentData.recipient || !rawAmount) {
      throw new Error('Missing recipient or amount in 402 response.')
    }

    console.log(`💳 Payment required: ${rawAmount} FLOW to ${paymentData.recipient}`)

    const txInfo = await makePayment(paymentData.recipient, rawAmount)
    const paymentHeader = encodePaymentHeader(txInfo)

    res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-payment': paymentHeader,
      },
      body: JSON.stringify(postBody),
    })

    const finalResponse = await tryParseJson(res)
    console.log('✅ Payment successful:', txInfo)
    console.log('📦 Final tool response:\n', JSON.stringify(finalResponse, null, 2))
  } else {
    const normalData = await tryParseJson(res)
    console.log('✅ Tool response:\n', JSON.stringify(normalData, null, 2))
  }
}

makeSmartPostRequest().catch((err) => {
  console.error('❌ Error:', err.message)
})
