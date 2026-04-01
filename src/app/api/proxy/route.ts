import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { url, headers } = await req.json()
    
    if (!url) {
      return NextResponse.json({ ok: false, status: 400, data: { error: 'URL is required' } })
    }

    const res = await fetch(url, { headers })
    
    const contentType = res.headers.get('content-type')
    let data
    if (contentType && contentType.includes('application/json')) {
      data = await res.json()
    } else {
      data = { text: await res.text() }
    }

    return NextResponse.json({ 
      ok: res.ok, 
      status: res.status, 
      data 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      status: 500, 
      data: { error: error.message || 'Proxy fetch failed' } 
    })
  }
}
