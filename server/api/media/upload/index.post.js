import { join } from 'path'
import { createWriteStream } from 'fs'
import { VIDEO_DIR } from '../../../utils/media'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readMultipartFormData(event)
  if (!body || body.length === 0) {
    throw createError({ statusCode: 400, message: 'no file provided' })
  }

  const file = body[0]
  const ext = file.filename ? file.filename.split('.').pop() : 'bin'
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = join(VIDEO_DIR, fileName)

  const writeStream = createWriteStream(filePath)
  writeStream.write(file.data)
  writeStream.end()

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve)
    writeStream.on('error', reject)
  })

  return {
    fileName,
    filePath: `media/uploads/videos/${fileName}`,
    originalName: file.filename,
    size: file.data.length
  }
})
