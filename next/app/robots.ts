import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/test.txt'],
    },
    sitemap: 'https://pongeki.awes.jp/sitemap.xml',
  }
}
