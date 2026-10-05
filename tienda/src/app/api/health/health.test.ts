import { describe, expect, it } from 'vitest'
import { GET as db } from './db/route'
import { GET as vivo } from './route'

describe('/api/health', () => {
  it('responde sin tocar la base', async () => {
    expect(vivo().status).toBe(200)
  })

  it('/api/health/db responde 200 con la base migrada', async () => {
    const res = await db()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })
})
