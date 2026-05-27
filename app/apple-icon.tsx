import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import path from 'path'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Logomark dims: 1335w × 1090h (RGBA, transparent bg)
const LOGO_ASPECT = 1335 / 1090

export default async function AppleIcon() {
  const logoData = await readFile(
    path.join(process.cwd(), 'public/assets/logomark-gold.png')
  )
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`

  const logoW = Math.round(size.width * 0.68)
  const logoH = Math.round(logoW / LOGO_ASPECT)

  return new ImageResponse(
    (
      <div
        style={{
          background: '#2c3e50',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={logoW} height={logoH} alt="" />
      </div>
    ),
    { ...size }
  )
}
