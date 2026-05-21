import path from 'node:path'
import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

for (const file of ['.env', '.env.local']) {
  const envPath = path.join(__dirname, file)
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath)
  }
}

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL
  }
})
