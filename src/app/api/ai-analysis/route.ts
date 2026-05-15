import ZAI from 'z-ai-web-dev-sdk'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { leaderboard, tournamentName } = await request.json()

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional Free Fire esports analyst. Analyze tournament data and provide insights in Indonesian language. Be concise but insightful. Use gaming/esports terminology.'
        },
        {
          role: 'user',
          content: `Analisis turnamen Free Fire "${tournamentName}" dengan data leaderboard berikut:\n\n${JSON.stringify(leaderboard.slice(0, 12), null, 2)}\n\nBerikan analisis singkat tentang: 1) Tim yang mendominasi 2) Underdog yang mengejutkan 3) Tren kill vs placement 4) Prediksi match selanjutnya`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const analysis = completion.choices[0]?.message?.content || 'Analisis tidak tersedia'

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('AI Analysis error:', error)
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 })
  }
}
