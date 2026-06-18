// Local filesystem storage for learning resource attachments.
// Files are written to <app-root>/uploads/ which is gitignored.
// storageKey format: resources/{sectionId}/{resourceId}/{uuid}-{sanitizedFilename}

import path from 'node:path'
import fs from 'node:fs/promises'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export function makeStorageKey(sectionId: string, resourceId: string, originalName: string): string {
  const safe = sanitizeFilename(originalName)
  const uid  = crypto.randomUUID()
  return `resources/${sectionId}/${resourceId}/${uid}-${safe}`
}

export async function writeFile(key: string, data: Buffer): Promise<void> {
  const abs = toAbsPath(key)
  await fs.mkdir(path.dirname(abs), { recursive: true })
  await fs.writeFile(abs, data)
}

export async function readFile(key: string): Promise<Buffer> {
  return fs.readFile(toAbsPath(key))
}

export async function deleteFile(key: string): Promise<void> {
  await fs.unlink(toAbsPath(key)).catch(() => {})
}

function toAbsPath(key: string): string {
  // Guard against path traversal — normalize then re-root under UPLOAD_DIR.
  const normalized = path.normalize(key).replace(/^(\.\.[/\\])+/, '')
  return path.join(UPLOAD_DIR, normalized)
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w.\-]/g, '_')   // keep alphanumeric, dot, hyphen, underscore
    .replace(/\.{2,}/g, '_')     // no double dots
    .slice(0, 200)
}
