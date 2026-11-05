import { createElement, type CSSProperties, type ReactElement } from 'react';
import { PRODUCT_ICONS } from '@/content/product-icons';
import type { ProductSlug } from '@/content/projects';
import { SITE } from '@/content/site';
import { PALETTE } from '@/lib/art/palette';

export const FONT = 'Geist';
const PAD = 72;
const BRAND_TOP = 60;
const BOTTOM = 68;
const TEXT_WIDTH = 600;
const SUBTITLE_WIDTH = 700;
const LOGO_SIZE = 48;
const TILE_SIZE = 84;
const TILE_ICON = 48;
const ICON_STROKE = 1.1;
const ICON_BASE_OPACITY = 0.4;
const TITLE = { longFrom: 18, small: 76, large: 108 } as const;
const SUBTITLE_COLOR = '#B7BFDA';
const SCRIM = 'linear-gradient(90deg, rgba(5,6,11,0.78) 0%, rgba(5,6,11,0.5) 38%, rgba(5,6,11,0) 64%)';

function picture(markup: string, size: number, style?: CSSProperties) {
  return createElement('img', { src: `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`, width: size, height: size, alt: '', style });
}

function iconSvg(slug: ProductSlug): string {
  const { base, accent } = PRODUCT_ICONS[slug];
  const paths = (list: readonly string[], color: string, opacity: number) => list.map((d) => `<path d="${d}" stroke="${color}" stroke-opacity="${opacity}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="${ICON_STROKE}" stroke-linecap="round" stroke-linejoin="round">${paths(base, PALETTE.text, ICON_BASE_OPACITY)}${paths(accent, PALETTE.accent, 1)}</svg>`;
}

function tile(slug: ProductSlug) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: TILE_SIZE, height: TILE_SIZE, borderRadius: 22, background: 'rgba(237,235,245,0.08)', border: '1px solid rgba(237,235,245,0.2)' }}>
      {picture(iconSvg(slug), TILE_ICON)}
    </div>
  );
}

export type CardInput = { title: string; subtitle?: string; icon?: ProductSlug; scene: string; logo: string };

export function card({ title, subtitle, icon, scene, logo }: CardInput): ReactElement {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: PALETTE.night, color: PALETTE.text, fontFamily: FONT }}>
      {createElement('img', { src: scene, width: 1200, height: 630, alt: '', style: { position: 'absolute', left: 0, top: 0 } })}
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', backgroundImage: SCRIM }} />
      <div style={{ position: 'absolute', left: PAD, top: BRAND_TOP, display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>
        {createElement('img', { src: logo, width: LOGO_SIZE, height: LOGO_SIZE, alt: '' })}
        {SITE.name}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', padding: `0 ${PAD}px ${BOTTOM}px` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: SUBTITLE_WIDTH }}>
          {icon ? tile(icon) : null}
          <div style={{ display: 'flex', width: TEXT_WIDTH, fontSize: title.length > TITLE.longFrom ? TITLE.small : TITLE.large, lineHeight: 1.02, letterSpacing: -2, fontWeight: 600 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 28, fontWeight: 400, color: SUBTITLE_COLOR, lineHeight: 1.4 }}>{subtitle}</div> : null}
        </div>
      </div>
    </div>
  );
}
