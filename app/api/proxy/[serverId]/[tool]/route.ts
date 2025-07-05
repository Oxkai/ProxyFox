import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { readFileSync } from 'fs'
import { verifyPayment } from '@/app/utils/payment/verifyPayment'

const Network = 'flow-evm-testnet'

export async function GET(req: NextRequest, context: any) {
  const params = await context.params
  return handleProxyRequest(req, params)
}

export async function POST(req: NextRequest, context: any) {
  const params = await context.params
  return handleProxyRequest(req, params)
}

async function handleProxyRequest(req: NextRequest, params: any) {
  const { serverId, tool } = params

  // 1️⃣ Load db.json config
  const dbPath = path.join(process.cwd(), 'lib', 'db.json')
  const servers = JSON.parse(readFileSync(dbPath, 'utf-8'))

  // 1️⃣ Check server exists
  const server = servers.find((s: any) => s.serverId === serverId)
  if (!server) {
    return NextResponse.json({ message: '❌ Server not found.' }, { status: 404 })
  }

  // 1️⃣ Check tool exists
  const selectedTool = server.tools.find((t: any) => t.toolName === tool)
  if (!selectedTool) {
    return NextResponse.json({ message: '❌ Tool not found.' }, { status: 404 })
  }


  // 2️⃣ Check if monetized
  const isMonetized = parseFloat(selectedTool.price.replace('$', '')) > 0

  if (isMonetized) {
    // 2️⃣ Check x-payment header
    const xPayment = req.headers.get('x-payment')
    if (!xPayment) {
      return NextResponse.json(
        {
          message: '💰 Payment Required',
          recipient: server.recipient,
          amount: `${selectedTool.price} FLOW`,
          payTo: server.recipient,
          network: Network,
          tool: selectedTool.toolName,
        },
        { status: 402 }
      )
    }

    // 3️⃣ Verify payment
    try {
      await verifyPayment(xPayment)
      // ✅ If payment verified — proxy to MCP server
      return proxyToMcpServer(req, server.serverUri, tool)
    } catch (error: any) {
      return NextResponse.json(
        {
          message: `❌ Invalid payment — ${error}`,
          recipient: server.recipient,
          tool: selectedTool.toolName,
        },
        { status: 402 }
      )
    }
  }

  // ✅ If tool free — proxy to MCP server
  return proxyToMcpServer(req, server.serverUri, tool)
}

async function proxyToMcpServer(req: NextRequest, serverUri: string, tool: string) {
  const proxyUrl = `${serverUri}/${tool}`
  const reqMethod = req.method

  const headers: any = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })

  let body = null
  if (reqMethod !== 'GET') {
    body = await req.text()
  }

  const proxiedRes = await fetch(proxyUrl, {
    method: reqMethod,
    headers,
    body,
  })

  const responseBody = await proxiedRes.text()

  return new NextResponse(responseBody, {
    status: proxiedRes.status,
    headers: proxiedRes.headers,
  })
}
