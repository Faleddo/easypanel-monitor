import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hostname, token } = body

    if (!hostname || !token) {
      return NextResponse.json(
        { error: 'Missing required fields: hostname, token' },
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
    const apiUrl = `${normalizedHostname}/api/trpc/monitor.getMonitorTableData`
    
    console.log('Attempting to fetch monitoring data from:', apiUrl)

    // Make the monitoring request to EasyPanel
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'EasyPanel-Monitor/1.0',
      }
    })

    console.log('EasyPanel monitoring response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('EasyPanel monitoring request failed:', response.status, errorText)
      
      return NextResponse.json(
        { 
          error: 'Monitoring request failed',
          details: response.status === 401 ? 'Invalid or expired token' : 
                   response.status === 404 ? 'EasyPanel monitoring API endpoint not found.' :
                   'Server error',
          status: response.status,
          url: apiUrl
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Monitoring data fetched successfully')
    
    // Return the monitoring data
    return NextResponse.json(data)

  } catch (error) {
    console.error('Monitoring request error:', error)
    
    return NextResponse.json(
      { 
        error: 'Monitoring request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 