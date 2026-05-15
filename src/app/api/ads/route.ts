import { NextRequest, NextResponse } from 'next/server'

// Ads API - placeholder (AdBanner model not in schema yet)
export async function GET(request: NextRequest) {
  return NextResponse.json([])
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
