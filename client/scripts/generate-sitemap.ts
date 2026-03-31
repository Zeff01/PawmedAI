import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const ROUTES_DIR = path.join(ROOT, 'src', 'routes')
const OUTPUT = path.join(ROOT, 'public', 'sitemap.xml')
const SITE_URL = process.env.SITE_URL ?? 'https://pawmed-ai.pages.dev'

const ROUTE_REGEX = /createFileRoute\(\s*['"]([^'"]+)['"]/g

const isDynamicRoute = (routePath: string) =>
  routePath.includes('$') || routePath.includes(':') || routePath.includes('*')

const normalizePath = (routePath: string) => {
  if (routePath === '/') return '/'
  const trimmed = routePath.replace(/\/+$/g, '')
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

const walk = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }
  return files
}

const extractRoutes = (content: string): string[] => {
  const routes: string[] = []
  let match: RegExpExecArray | null
  while ((match = ROUTE_REGEX.exec(content)) !== null) {
    routes.push(match[1])
  }
  return routes
}

const toUrl = (routePath: string) =>
  `${SITE_URL}${routePath === '/' ? '' : routePath}`

const main = async () => {
  const files = await walk(ROUTES_DIR)
  const routePaths = new Set<string>()

  for (const file of files) {
    const content = await readFile(file, 'utf8')
    const routes = extractRoutes(content)
    for (const routePath of routes) {
      if (isDynamicRoute(routePath)) continue
      routePaths.add(normalizePath(routePath))
    }
  }

  const lastmod = new Date().toISOString().slice(0, 10)
  const urls = Array.from(routePaths).sort()

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (routePath) =>
          `  <url>\n` +
          `    <loc>${toUrl(routePath)}</loc>\n` +
          `    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>weekly</changefreq>\n` +
          `    <priority>${routePath === '/' ? '1.0' : '0.8'}</priority>\n` +
          `  </url>`,
      )
      .join('\n') +
    `\n</urlset>\n`

  await writeFile(OUTPUT, xml)
  console.log(`Sitemap written to ${OUTPUT}`)
}

main().catch((error) => {
  console.error('Failed to generate sitemap:', error)
  process.exit(1)
})
