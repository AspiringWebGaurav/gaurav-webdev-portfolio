import Script from 'next/script'

export default function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Gaurav Patil',
    jobTitle: 'Full Stack Developer & Software Engineer',
    url: 'https://www.gauravpatil.online',
    sameAs: [
      'https://github.com/gauravpatil',
      'https://linkedin.com/in/gauravpatil',
      'https://twitter.com/gauravpatil',
    ],
    image: 'https://www.gauravpatil.online/opengraph-image',
    description: 'Expert Full Stack Developer specializing in Next.js, React, TypeScript, and Firebase. Building scalable web applications and enterprise solutions.',
    knowsAbout: [
      'Next.js',
      'React',
      'TypeScript',
      'JavaScript',
      'Firebase',
      'Node.js',
      'Web Development',
      'Cloud Architecture',
      'API Development',
      'Database Design',
      'Frontend Development',
      'Backend Development',
    ],
    alumniOf: {
      '@type': 'Organization',
      name: 'Your University/College',
    },
    worksFor: {
      '@type': 'Organization',
      name: 'Independent Developer',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Professional',
      url: 'https://www.gauravpatil.online#contact',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://www.gauravpatil.online',
    },
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Gaurav Patil - Full Stack Developer Portfolio',
    alternateName: 'Gaurav Patil',
    url: 'https://www.gauravpatil.online',
    description: 'Professional portfolio showcasing full-stack development projects, technical expertise, and innovative web solutions by Gaurav Patil.',
    author: {
      '@type': 'Person',
      name: 'Gaurav Patil',
    },
    inLanguage: 'en-US',
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: {
      '@type': 'Person',
      name: 'Gaurav Patil',
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.gauravpatil.online',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Projects',
        item: 'https://www.gauravpatil.online#projects',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Skills',
        item: 'https://www.gauravpatil.online#skills',
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'Contact',
        item: 'https://www.gauravpatil.online#contact',
      },
    ],
  }

  return (
    <>
      <Script
        id="person-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  )
}
