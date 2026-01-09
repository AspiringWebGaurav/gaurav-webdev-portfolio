export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Disallow admin routes
Disallow: /admin/
Disallow: /api/

# Disallow special utility pages
Disallow: /banned
Disallow: /suspnd_srv_temp_*

# Allow important pages
Allow: /privacy
Allow: /terms
Allow: /cookies

# Sitemap
Sitemap: https://www.gauravpatil.online/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
