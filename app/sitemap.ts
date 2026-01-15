import { MetadataRoute } from 'next'

/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml for Google Search Console
 * 
 * Access: https://www.gauravpatil.online/sitemap.xml
 * Submit to: Google Search Console -> Sitemaps
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || 'https://www.gauravpatil.online'
  const currentDate = new Date()
  
  return [
    // Homepage - Highest priority
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    
    // Legal/Policy Pages - Required for compliance
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    
    // Special Pages
    {
      url: `${baseUrl}/maintenance`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.1,
    },
    
    // Note: Admin routes are excluded (disallowed in robots.txt)
    // Note: API routes are excluded (not indexable)
    // Note: Hash anchors (#projects, #experience) are handled by homepage
  ]
}
