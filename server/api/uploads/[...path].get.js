import { existsSync, createReadStream } from 'fs'
import { join } from 'path'
import { sendStream } from 'h3'

export default defineEventHandler(async (event) => {
  const { path } = getRouterParams(event)
  if (!path) throw createError({ statusCode: 400, message: 'path is required' })

  const fullPath = join(process.cwd(), 'media', 'uploads', path)
  if (!existsSync(fullPath)) {
    throw createError({ statusCode: 404, message: 'file not found' })
  }

  const ext = path.split('.').pop()
  const mimes = { vtt: 'text/vtt', srt: 'text/plain', mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', m4a: 'audio/mp4', mp4: 'video/mp4', webm: 'video/webm' }
  const mime = mimes[ext] || 'application/octet-stream'
  setHeader(event, 'Content-Type', mime)
  setHeader(event, 'Cache-Control', 'public, max-age=3600')

  return sendStream(event, createReadStream(fullPath))
})
