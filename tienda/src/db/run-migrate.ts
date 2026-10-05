import 'dotenv/config'
import { required } from '@/lib/env'
import { runMigrations } from './migrate'

runMigrations({ databaseUrl: required('DATABASE_URL') })
  .then(() => {
    console.log('Migraciones al dia.')
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
