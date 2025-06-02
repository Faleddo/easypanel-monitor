import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hostname } = body

    if (!hostname) {
      return NextResponse.json(
        { error: 'Missing hostname' },
        { status: 400 }
      )
    }

    // Normalize the hostname
    let normalizedHostname = hostname.trim()
    if (!normalizedHostname.startsWith('http://') && !normalizedHostname.startsWith('https://')) {
      normalizedHostname = `https://${normalizedHostname}`
    }
    normalizedHostname = normalizedHostname.replace(/\/$/, '')

    // Try different potential tRPC endpoint structures
    const potentialEndpoints = [
      // Standard tRPC endpoints
      `${normalizedHostname}/api/trpc/auth.login`,
      `${normalizedHostname}/trpc/auth.login`,
      
      // With query parameters (some tRPC setups use this)
      `${normalizedHostname}/api/trpc/auth.login?batch=1`,
      `${normalizedHostname}/api/trpc/auth.login?input=%7B%22json%22%3A%7B%7D%7D`,
      
      // Alternative paths
      `${normalizedHostname}/api/auth/login`,
      `${normalizedHostname}/auth/login`,
      
      // With different tRPC formats
      `${normalizedHostname}/api/trpc/auth/login`,
      `${normalizedHostname}/api/trpc/auth`,
      
      // Check if there's a different API structure
      `${normalizedHostname}/api/trpc`,
      `${normalizedHostname}/api`,
    ]

    const results = []

    for (const endpoint of potentialEndpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`)
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'EasyPanel-Monitor-Debug/1.0',
          },
          body: JSON.stringify({
            json: {
              email: "test@example.com",
              password: "test",
              rememberMe: false,
              code: "string"
            }
          })
        })

        const responseText = await response.text()
        
        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText.substring(0, 500), // Limit response size
          contentType: response.headers.get('content-type')
        })

        // Also try GET request for some endpoints
        if (endpoint.includes('/api/trpc') && !endpoint.includes('auth.login')) {
          const getResponse = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'User-Agent': 'EasyPanel-Monitor-Debug/1.0',
            }
          })
          
          const getResponseText = await getResponse.text()
          
          results.push({
            endpoint: `${endpoint} (GET)`,
            status: getResponse.status,
            statusText: getResponse.statusText,
            headers: Object.fromEntries(getResponse.headers.entries()),
            body: getResponseText.substring(0, 500),
            contentType: getResponse.headers.get('content-type')
          })
        }

      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      hostname: normalizedHostname,
      tested_endpoints: results,
      suggestions: [
        "Check the results above to identify working endpoints",
        "Look for endpoints that return 405 (Method Not Allowed) - they exist but may need different HTTP methods",
        "Check endpoints that return 400/422 for correct format",
        "tRPC endpoints might require specific query parameters or batch requests"
      ]
    })

  } catch (error) {
    console.error('Debug error:', error)
    
    return NextResponse.json(
      { 
        error: 'Debug request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 