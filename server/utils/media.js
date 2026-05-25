import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const MEDIA_DIR = join(process.cwd(), 'media', 'uploads')
export const VIDEO_DIR = join(MEDIA_DIR, 'videos')

function ensureDirs() {
  if (!existsSync(VIDEO_DIR)) mkdirSync(VIDEO_DIR, { recursive: true })
}
ensureDirs()

export async function getAllMedia() {
  return prisma.media.findMany({
    include: { versions: true, episodes: { include: { versions: true } } },
    orderBy: { title: 'asc' }
  })
}

export async function getMediaById(id) {
  return prisma.media.findUnique({
    where: { id },
    include: { versions: true, episodes: { include: { versions: true } } }
  })
}

export async function createMedia(data) {
  return prisma.media.create({ data })
}

export async function updateMedia(id, data) {
  return prisma.media.update({ where: { id }, data })
}

export async function deleteMedia(id) {
  try {
    await prisma.version.deleteMany({ where: { mediaId: id } })
    const episodes = await prisma.episode.findMany({ where: { mediaId: id } })
    for (const ep of episodes) {
      await prisma.episodeVersion.deleteMany({ where: { episodeId: ep.id } })
    }
    await prisma.episode.deleteMany({ where: { mediaId: id } })
    await prisma.media.delete({ where: { id } })
    return true
  } catch {
    return false
  }
}

export async function addVersion(id, version) {
  return prisma.version.create({ data: { ...version, mediaId: id } })
}

export async function removeVersion(id, versionId) {
  return prisma.version.delete({ where: { id: versionId } }).then(() => true).catch(() => false)
}

export async function addEpisode(id, episode) {
  return prisma.episode.create({ data: { ...episode, mediaId: id } })
}

export async function removeEpisode(id, episodeId) {
  await prisma.episodeVersion.deleteMany({ where: { episodeId } })
  return prisma.episode.delete({ where: { id: episodeId } }).then(() => true).catch(() => false)
}

export async function updateEpisode(id, episodeId, data) {
  return prisma.episode.update({ where: { id: episodeId }, data })
}

export async function addEpisodeVersion(id, episodeId, version) {
  return prisma.episodeVersion.create({ data: { ...version, episodeId } })
}

export async function removeEpisodeVersion(id, episodeId, versionId) {
  return prisma.episodeVersion.delete({ where: { id: versionId } }).then(() => true).catch(() => false)
}
