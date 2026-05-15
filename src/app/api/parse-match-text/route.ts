import ZAI from 'z-ai-web-dev-sdk'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text, registeredTeams } = await request.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    const teamList = registeredTeams.map((t: { name: string; tag: string }) => `- ${t.name} (TAG: ${t.tag})`).join('\n')

    const prompt = `Kamu adalah parser khusus untuk membaca hasil pertandingan Free Fire.

Teks berikut adalah hasil match Free Fire yang di-copy paste oleh user. Tugas kamu:
1. Baca dan parse semua nama tim/nickname player
2. Identifikasi posisi/placement setiap tim (1st, 2nd, 3rd, dst)
3. Identifikasi jumlah kill setiap tim jika disebutkan
4. Cocokkan nama yang terbaca dengan daftar tim terdaftar

TEKS YANG DI-PASTE:
${text}

DAFTAR TIM TERDAFTAR:
${teamList}

PENTING:
- Cocokkan nama yang terbaca dengan tim terdaftar di atas (nama bisa singkat, typo, atau berbeda sedikit)
- Jika kills tidak disebutkan, set ke 0
- Urutkan berdasarkan placement

OUTPUT dalam format JSON saja (tanpa markdown code block):
{
  "matchResults": [
    {"teamTag": "TAG_TIM", "teamName": "Nama Tim", "placement": 1, "kills": 5, "confidence": "high"},
    ...
  ],
  "notes": "catatan jika ada"
}`

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Kamu adalah parser data hasil pertandingan Free Fire. Selalu output JSON valid saja, tanpa penjelasan tambahan.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.05,
      max_tokens: 800,
    })

    const content = response.choices[0]?.message?.content || ''

    let jsonStr = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) jsonStr = jsonMatch[1].trim()

    let parsed
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      const braceMatch = content.match(/\{[\s\S]*\}/)
      if (braceMatch) {
        try { parsed = JSON.parse(braceMatch[0]) }
        catch { return NextResponse.json({ error: 'Failed to parse', raw: content }, { status: 500 }) }
      } else {
        return NextResponse.json({ error: 'No valid JSON', raw: content }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, data: parsed, raw: content })
  } catch (error: any) {
    console.error('Parse text error:', error)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}
