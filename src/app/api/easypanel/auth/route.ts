import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hostname, email, password } = body

    if (!hostname || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: hostname, email, password' },
        { status: 400 }
      )
    }

    // Normalize the hostname to ensure it has the proper protocol
    let normalizedHostname = hostname.trim()
    if (!normalizedHostname.startsWith('http://') && !normalizedHostname.startsWith('https://')) {
      normalizedHostname = `https://${normalizedHostname}`
    }
    
    // Remove trailing slash if present
    normalizedHostname = normalizedHostname.replace(/\/$/, '')

    // Construct the API URL
    const apiUrl = `${normalizedHostname}/api/trpc/auth.login`
    
    console.log('Attempting authentication to:', apiUrl)

    // Make the authentication request to EasyPanel
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EasyPanel-Monitor/1.0',
      },
      body: JSON.stringify({
        json: {
          email,
          password,
          rememberMe: false,
          code: "string"
        }
      })
    })

    console.log('EasyPanel response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('EasyPanel authentication failed:', response.status, errorText)
      
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          details: response.status === 401 ? 'Invalid credentials' : 
                   response.status === 404 ? 'EasyPanel API endpoint not found. Please check your hostname.' :
                   'Server error',
          status: response.status,
          url: apiUrl
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Authentication successful')
    
    // Return the response data
    return NextResponse.json(data)

  } catch (error) {
    console.error('Authentication error:', error)
    
    return NextResponse.json(
      { 
        error: 'Authentication request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 