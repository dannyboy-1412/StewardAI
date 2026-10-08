import { Injectable, Logger } from '@nestjs/common'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly supabase: SupabaseClient | null
  private readonly bucket: string
  private readonly localRoot = join(process.cwd(), 'uploads')

  constructor() {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'documents'
    this.supabase = url && key ? createClient(url, key) : null
    if (!this.supabase) {
      this.logger.warn('Supabase Storage not configured — files go to ./uploads')
    }
  }

  async upload(path: string, body: Buffer, contentType: string): Promise<string> {
    if (this.supabase) {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .upload(path, body, { contentType, upsert: true })
      if (error) throw error
      return path
    }
    const full = join(this.localRoot, path)
    await mkdir(dirname(full), { recursive: true })
    await writeFile(full, body)
    return path
  }

  async download(path: string): Promise<Buffer> {
    if (this.supabase) {
      const { data, error } = await this.supabase.storage.from(this.bucket).download(path)
      if (error || !data) throw error ?? new Error('Download failed')
      return Buffer.from(await data.arrayBuffer())
    }
    return readFile(join(this.localRoot, path))
  }

  async publicUrl(path: string): Promise<string> {
    if (this.supabase) {
      const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path)
      return data.publicUrl
    }
    return `/files/local/${path}`
  }
}
