import ZAI from 'z-ai-web-dev-sdk'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { imageBase64, registeredTeams } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    const teamList = registeredTeams.map((t: { name: string; tag: string }) => `- ${t.name} (TAG: ${t.tag})`).join('\n')

    const prompt = `Kamu adalah AI OCR khusus untuk membaca hasil pertandingan Free Fire dari screenshot.

Screenshot ini menampilkan hasil match Free Fire. Tugas kamu:
1. Baca semua nama tim/player yang muncul di layar
2. Identifikasi posisi/placement setiap tim (1st, 2nd, 3rd, dst)
3. Identifikasi jumlah kill setiap tim jika terlihat
4. Cocokkan nama yang terbaca dengan daftar tim terdaftar di bawah

DAFTAR TIM TERDAFTAR:
${teamList}

PENTING:
- Cocokkan nama yang terbaca di gambar dengan tim terdaftar di atas (nama bisa sedikit berbeda, coba match yang paling mirip)
- Jika ada nama yang tidak cocok dengan tim terdaftar, tetap masukkan dengan nama asli dari gambar
- Kills bisa saja tidak terlihat di screenshot, jika tidak terlihat set ke 0

OUTPUT dalam format JSON saja (tanpa markdown code block):
{
  "matchResults": [
    {"teamTag": "TAG_TIM", "teamName": "Nama Tim", "placement": 1, "kills": 5, "confidence": "high"},
    ...
  ],
  "matchNumber": null,
  "notes": "catatan tambahan jika ada"
}

confidence: "high" jika sangat yakin, "medium" jika kurang yakin, "low" jika ragu`

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      ],
      thinking: { type: 'disabled' },
      temperature: 0.1,
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content || ''

    // Parse JSON from response
    let jsonStr = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    let parsed
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      const braceMatch = content.match(/\{[\s\S]*\}/)
      if (braceMatch) {
        try {
          parsed = JSON.parse(braceMatch[0])
        } catch {
          return NextResponse.json({ error: 'Failed to parse AI response', raw: content }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: 'No valid JSON in AI response', raw: content }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, data: parsed, raw: content })
  } catch (error: any) {
    console.error('Image analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze image: ' + error.message }, { status: 500 })
  }
}
