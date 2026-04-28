import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const ROUTES_DIR = path.join(ROOT, 'src', 'routes')
const PUBLIC_OUTPUT = path.join(ROOT, 'public', 'sitemap.xml')
const DIST_OUTPUT = path.join(ROOT, 'dist', 'sitemap.xml')
const ANIMALS_JSON = path.join(ROOT, 'public', 'animals.json')
const SITE_URL = (process.env.SITE_URL ?? 'https://pawmedai.com').replace(/\/$/, '')

const ROUTE_REGEX = /createFileRoute\(\s*['"]([^'"]+)['"]/g

const EXCLUDED_ROUTES = ['/home', '/auth/callback', '/auth/google/callback', '/$']

const ROUTE_CONFIG: Record<string, { priority: string; changefreq: string }> = {
  '/': { priority: '1.0', changefreq: 'weekly' },
  '/classify': { priority: '0.95', changefreq: 'weekly' },
  '/classify-breed': { priority: '0.9', changefreq: 'weekly' },
  '/nearby-vets': { priority: '0.85', changefreq: 'weekly' },
  '/lifecycle': { priority: '0.7', changefreq: 'monthly' },
}

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
  `${SITE_URL}${routePath === '/' ? '/' : routePath}`

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

const loadAnimalSlugs = async (): Promise<string[]> => {
  try {
    const raw = await readFile(ANIMALS_JSON, 'utf8')
    const animals: Array<{ name: string }> = JSON.parse(raw)
    return animals.map((a) => slugify(a.name)).filter(Boolean)
  } catch {
    return []
  }
}

const fileExists = async (target: string) => {
  try {
    await stat(target)
    return true
  } catch {
    return false
  }
}

const main = async () => {
  const files = await walk(ROUTES_DIR)
  const routePaths = new Set<string>()

  for (const file of files) {
    const content = await readFile(file, 'utf8')
    const routes = extractRoutes(content)
    for (const routePath of routes) {
      if (isDynamicRoute(routePath)) continue
      const normalized = normalizePath(routePath)
      if (EXCLUDED_ROUTES.includes(normalized)) continue
      routePaths.add(normalized)
    }
  }

  const animalSlugs = await loadAnimalSlugs()
  for (const slug of animalSlugs) {
    routePaths.add(`/animals/${slug}`)
  }

  const lastmod = new Date().toISOString().slice(0, 10)
  const urls = Array.from(routePaths).sort()

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((routePath) => {
        const config =
          ROUTE_CONFIG[routePath] ??
          (routePath.startsWith('/animals/')
            ? { priority: '0.6', changefreq: 'monthly' }
            : { priority: '0.8', changefreq: 'weekly' })
        return (
          `  <url>\n` +
          `    <loc>${toUrl(routePath)}</loc>\n` +
          `    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>${config.changefreq}</changefreq>\n` +
          `    <priority>${config.priority}</priority>\n` +
          `  </url>`
        )
      })
      .join('\n') +
    `\n</urlset>\n`

  await writeFile(PUBLIC_OUTPUT, xml)
  console.log(`Sitemap written to ${PUBLIC_OUTPUT} (${urls.length} URLs)`)

  // When invoked as a postbuild step, dist/ already exists and Vite has
  // already copied public/sitemap.xml — so write it directly to dist/ too.
  const distRoot = path.dirname(DIST_OUTPUT)
  if (await fileExists(distRoot)) {
    await writeFile(DIST_OUTPUT, xml)
    console.log(`Sitemap written to ${DIST_OUTPUT}`)
  }
}

main().catch((error) => {
  console.error('Failed to generate sitemap:', error)
  process.exit(1)
})
