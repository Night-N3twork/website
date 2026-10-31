import { useNonce } from './nonce';
import { organizationJsonLd, serializeJsonLd, webSiteJsonLd } from '@/lib/seo/jsonld';

const BLOCKS = [
  { key: 'organization', json: serializeJsonLd(organizationJsonLd()) },
  { key: 'website', json: serializeJsonLd(webSiteJsonLd()) },
];

export function SiteJsonLd() {
  const nonce = useNonce();
  return (
    <>
      {BLOCKS.map(({ key, json }) => (
        <script key={key} type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: json }} />
      ))}
    </>
  );
}
