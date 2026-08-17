import business from '../config/business.json';
import { toE164, absoluteUrl, isClosed, activeSocials, isoDate } from './utils';

/**
 * Schema generation helpers.
 *
 * Every page emits exactly ONE <script type="application/ld+json"> block
 * containing a single @graph. Each node carries an absolute @id with a
 * fragment, and every cross-reference points at an @id that exists in the
 * same graph.
 */

export type PageType =
  | 'home'
  | 'service'
  | 'location'
  | 'blog'
  | 'about'
  | 'contact'
  | 'default';

export interface Breadcrumb {
  label: string;
  href: string;
}

export interface ServiceSchemaInput {
  name: string;
  description: string;
}

export interface BlogPostSchemaInput {
  title: string;
  description: string;
  pubDate: Date;
  modDate?: Date;
  author: string;
  image?: string;
}

export interface LocationSchemaInput {
  name: string;
  state: string;
  wiki?: string;
}

export interface SchemaOptions {
  pageType?: PageType;
  pageUrl: string;
  title: string;
  description: string;
  breadcrumbs?: Breadcrumb[];
  service?: ServiceSchemaInput;
  blogPost?: BlogPostSchemaInput;
  location?: LocationSchemaInput;
  image?: string;
}

type SchemaNode = Record<string, unknown>;

/* -------------------------------------------------------------------------
   Stable @id builders
   ------------------------------------------------------------------------- */

const site = business.domain.replace(/\/$/, '');

export const ID = {
  organization: `${site}/#organization`,
  localBusiness: `${site}/#localbusiness`,
  website: `${site}/#website`,
  logo: `${site}/#logo`,
  webPage: (url: string) => `${url}#webpage`,
  breadcrumb: (url: string) => `${url}#breadcrumb`,
  service: (url: string) => `${url}#service`,
  place: (url: string) => `${url}#place`,
  blogPosting: (url: string) => `${url}#blogposting`,
  person: (name: string) => `${site}/#person-${slugForId(name)}`,
};

function slugForId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* -------------------------------------------------------------------------
   Shared sub-objects
   ------------------------------------------------------------------------- */

/** sameAs order mirrors business.json declaration order exactly (spec §12). */
export function sameAs(): string[] {
  const urls = activeSocials().map((s) => s.url);
  if (business.gbpUrl && !urls.includes(business.gbpUrl)) urls.unshift(business.gbpUrl);
  return urls;
}

/**
 * Service-area businesses have no public street address — omit the empty
 * fields rather than emitting blank strings (schema areaServed carries the
 * coverage instead).
 */
export function postalAddress(): SchemaNode {
  const node: SchemaNode = {
    '@type': 'PostalAddress',
    addressLocality: business.location.city,
    addressRegion: business.location.state,
    addressCountry: business.location.country,
  };
  if (business.location.street) node.streetAddress = business.location.street;
  if (business.location.zip) node.postalCode = business.location.zip;
  return node;
}

export function geoCoordinates(): SchemaNode {
  return {
    '@type': 'GeoCoordinates',
    latitude: business.location.latitude,
    longitude: business.location.longitude,
  };
}

/** Omitted entirely when the hours array is empty (spec §12). */
export function openingHours(): SchemaNode[] | undefined {
  if (!business.hours?.length) return undefined;
  const open = business.hours.filter((h) => !isClosed(h));
  if (!open.length) return undefined;
  return open.map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.dayOfWeek,
    opens: h.opens,
    closes: h.closes,
  }));
}

export function areaServed(): SchemaNode[] {
  return business.serviceAreas.map((area) => ({
    '@type': 'City',
    name: area.name,
    ...(area.wiki ? { sameAs: area.wiki } : {}),
  }));
}

/* -------------------------------------------------------------------------
   Base graph nodes — present on every page
   ------------------------------------------------------------------------- */

/**
 * The logo is a top-level graph node rather than an inline object, so that
 * `{ "@id": "…#logo" }` references from Organization and LocalBusiness resolve
 * within the graph (spec §12).
 */
export function logoNode(): SchemaNode {
  return {
    '@type': 'ImageObject',
    '@id': ID.logo,
    url: absoluteUrl('/images/logo.webp'),
    contentUrl: absoluteUrl('/images/logo.webp'),
    caption: business.name,
  };
}

export function organizationNode(): SchemaNode {
  return {
    '@type': 'Organization',
    '@id': ID.organization,
    name: business.name,
    url: `${site}/`,
    logo: { '@id': ID.logo },
    image: { '@id': ID.logo },
    email: business.email,
    telephone: toE164(business.phone),
    address: postalAddress(),
    sameAs: sameAs(),
  };
}

export function localBusinessNode(): SchemaNode {
  const hours = openingHours();
  const node: SchemaNode = {
    '@type': 'LocalBusiness',
    '@id': ID.localBusiness,
    name: business.name,
    url: `${site}/`,
    image: { '@id': ID.logo },
    logo: { '@id': ID.logo },
    telephone: toE164(business.phone),
    email: business.email,
    priceRange: business.priceRange,
    address: postalAddress(),
    geo: geoCoordinates(),
    areaServed: areaServed(),
    parentOrganization: { '@id': ID.organization },
    sameAs: sameAs(),
  };

  if (hours) node.openingHoursSpecification = hours;

  if (business.aggregateRating?.ratingValue && business.aggregateRating?.reviewCount) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: business.aggregateRating.ratingValue,
      reviewCount: business.aggregateRating.reviewCount,
    };
  }

  if (business.license?.value) {
    node.hasCredential = {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: business.license.name,
      identifier: business.license.value,
    };
  }

  return node;
}

export function webSiteNode(): SchemaNode {
  return {
    '@type': 'WebSite',
    '@id': ID.website,
    url: `${site}/`,
    name: business.name,
    description: business.tagline,
    publisher: { '@id': ID.organization },
    inLanguage: 'en-US',
  };
}

export function webPageNode(opts: SchemaOptions): SchemaNode {
  const node: SchemaNode = {
    '@type': webPageType(opts.pageType),
    '@id': ID.webPage(opts.pageUrl),
    url: opts.pageUrl,
    name: opts.title,
    description: opts.description,
    isPartOf: { '@id': ID.website },
    about: { '@id': ID.organization },
    inLanguage: 'en-US',
  };

  if (opts.image) node.primaryImageOfPage = { '@type': 'ImageObject', url: opts.image };
  if (opts.breadcrumbs?.length) node.breadcrumb = { '@id': ID.breadcrumb(opts.pageUrl) };

  return node;
}

function webPageType(pageType: PageType = 'default'): string {
  switch (pageType) {
    case 'about':
      return 'AboutPage';
    case 'contact':
      return 'ContactPage';
    case 'home':
      return 'WebPage';
    default:
      return 'WebPage';
  }
}

export function breadcrumbNode(pageUrl: string, crumbs: Breadcrumb[]): SchemaNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': ID.breadcrumb(pageUrl),
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: absoluteUrl(crumb.href),
    })),
  };
}

/* -------------------------------------------------------------------------
   Per-template nodes
   ------------------------------------------------------------------------- */

export function serviceNode(pageUrl: string, service: ServiceSchemaInput): SchemaNode {
  return {
    '@type': 'Service',
    '@id': ID.service(pageUrl),
    name: service.name,
    description: service.description,
    serviceType: service.name,
    provider: { '@id': ID.localBusiness },
    areaServed: areaServed(),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      priceRange: business.priceRange,
      availability: 'https://schema.org/InStock',
      seller: { '@id': ID.localBusiness },
    },
  };
}

export function placeNode(pageUrl: string, location: LocationSchemaInput): SchemaNode {
  return {
    '@type': 'Place',
    '@id': ID.place(pageUrl),
    name: `${location.name}, ${location.state}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: location.name,
      addressRegion: location.state,
      addressCountry: business.location.country,
    },
    ...(location.wiki ? { sameAs: location.wiki } : {}),
  };
}

export function personNode(person: {
  name: string;
  title?: string;
  image?: string;
  bio?: string;
  linkedin?: string;
}): SchemaNode {
  const node: SchemaNode = {
    '@type': 'Person',
    '@id': ID.person(person.name),
    name: person.name,
    worksFor: { '@id': ID.organization },
  };
  if (person.title) node.jobTitle = person.title;
  if (person.image) node.image = absoluteUrl(person.image);
  if (person.bio) node.description = person.bio;
  if (person.linkedin) node.sameAs = [person.linkedin];
  return node;
}

export function blogPostingNode(pageUrl: string, post: BlogPostSchemaInput): SchemaNode {
  return {
    '@type': 'BlogPosting',
    '@id': ID.blogPosting(pageUrl),
    headline: post.title,
    description: post.description,
    datePublished: isoDate(post.pubDate),
    dateModified: isoDate(post.modDate ?? post.pubDate),
    author: { '@id': ID.person(post.author) },
    publisher: { '@id': ID.organization },
    mainEntityOfPage: { '@id': ID.webPage(pageUrl) },
    ...(post.image ? { image: absoluteUrl(post.image) } : {}),
    inLanguage: 'en-US',
  };
}

export function faqPageNode(
  pageUrl: string,
  items: { question: string; answer: string }[]
): SchemaNode {
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/* -------------------------------------------------------------------------
   Graph assembly
   ------------------------------------------------------------------------- */

export function buildGraph(opts: SchemaOptions): SchemaNode {
  const pageType = opts.pageType ?? 'default';
  const graph: SchemaNode[] = [
    logoNode(),
    organizationNode(),
    webSiteNode(),
    webPageNode(opts),
  ];

  if (opts.breadcrumbs?.length) {
    graph.push(breadcrumbNode(opts.pageUrl, opts.breadcrumbs));
  }

  // LocalBusiness rides along on the templates that describe the business itself.
  const needsLocalBusiness = ['home', 'service', 'location', 'contact', 'about'].includes(
    pageType
  );
  if (needsLocalBusiness) graph.push(localBusinessNode());

  if (pageType === 'service' && opts.service) {
    graph.push(serviceNode(opts.pageUrl, opts.service));
  }

  if (pageType === 'location' && opts.location) {
    graph.push(placeNode(opts.pageUrl, opts.location));
  }

  if (pageType === 'about' && business.team?.length) {
    business.team.forEach((member) => graph.push(personNode(member)));
  }

  if (pageType === 'blog' && opts.blogPost) {
    graph.push(personNode({ name: opts.blogPost.author }));
    graph.push(blogPostingNode(opts.pageUrl, opts.blogPost));
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
