import nodemailer from 'nodemailer'

export async function sendOTPEmail(to: string, code: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
    console.log(`[DEV] OTP for ${to}: ${code}`)
    return true
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'FoxArea Tournament <noreply@foxarea.com>',
      to,
      subject: 'Kode Verifikasi FoxArea Tournament',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; background: #1a1a2e; color: #f1f5f9; border-radius: 12px;">
          <h2 style="color: #2563EB; margin: 0 0 16px;">FOXAREA TOURNAMENT</h2>
          <p>Kode verifikasi kamu:</p>
          <div style="font-size: 32px; font-weight: 900; color: #2563EB; letter-spacing: 8px; padding: 16px; background: #252540; border-radius: 8px; text-align: center;">${code}</div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">Kode berlaku 5 menit. Jangan bagikan kode ini.</p>
        </div>
      `,
    })
    return true
  } catch (err) {
    console.error('Email send failed:', err)
    return false
  }
}
