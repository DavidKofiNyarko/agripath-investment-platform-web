import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/settings/', '/transactions/', '/portfolio/'],
    },
    sitemap: 'https://agripath.co/sitemap.xml',
  }
}
