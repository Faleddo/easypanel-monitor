import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { hostname, token } = await request.json()

    if (!hostname || !token) {
      return NextResponse.json(
        { error: 'Missing hostname or token' },
        { status: 400 }
      )
    }

    // Ensure hostname has protocol
    const baseUrl = hostname.startsWith('http') 
      ? hostname.replace(/\/$/, '') 
      : `https://${hostname}`
    
    const apiUrl = `${baseUrl}/api/trpc/monitor.getSystemStats`

    console.log(`[SystemStats] Making request to: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'EasyPanel-Monitor/1.0',
      },
    })

    const responseText = await response.text()
    console.log(`[SystemStats] Response status: ${response.status}`)
    console.log(`[SystemStats] Response text: ${responseText.substring(0, 200)}...`)

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'System stats request failed',
          status: response.status,
          statusText: response.statusText,
          details: responseText
        },
        { status: response.status }
      )
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('[SystemStats] Failed to parse JSON:', parseError)
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from server',
          details: responseText.substring(0, 500)
        },
        { status: 502 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('[SystemStats] Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 