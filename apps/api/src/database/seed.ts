import 'reflect-metadata'
import dataSource from './data-source'

async function seed() {
  await dataSource.initialize()
  console.info('[seed] connected')
  // Seeds are intentionally minimal — install your first user via sign-up.
  await dataSource.destroy()
  console.info('[seed] done')
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
