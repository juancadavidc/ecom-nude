import { describe, expect, it } from 'vitest'
import { toTestDatabaseUrl } from './test-db'

describe('toTestDatabaseUrl', () => {
  it('agrega _test al nombre de la base', () => {
    expect(toTestDatabaseUrl('postgres://u:p@localhost:5435/nude_db')).toBe('postgres://u:p@localhost:5435/nude_db_test')
  })

  it('no duplica el sufijo', () => {
    expect(toTestDatabaseUrl('postgres://u:p@localhost:5435/nude_db_test')).toBe('postgres://u:p@localhost:5435/nude_db_test')
  })
})
