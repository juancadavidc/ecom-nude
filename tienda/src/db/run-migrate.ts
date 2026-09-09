import 'dotenv/config'
import { runMigrations } from './migrate'

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
