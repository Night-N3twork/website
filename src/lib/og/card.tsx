import { createElement, type CSSProperties, type ReactElement } from 'react';
import { PRODUCT_ICONS } from '@/content/product-icons';
import type { ProductSlug } from '@/content/projects';
import { SITE } from '@/content/site';
import { bodySvg } from '@/lib/art/BodyArt';
import { PALETTE } from '@/lib/art/palette';

export const FONT = 'Unbounded';
const PAD = 72;
const BODY_SIZE = 640;
const BODY_OFFSET = { right: -140, top: -80 } as const;
const ICON_SIZE = 380;
const ICON_OFFSET = { right: 96, top: 125 } as const;
const ICON_STROKE = 0.9;
const ICON_BASE_OPACITY = 0.3;
const BRAND_TOP = 64;
const TEXT_MAX_WIDTH = 800;
const MARK_SIZE = 36;
const TITLE = { longFrom: 18, small: 64, large: 92 } as const;
const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><mask id="m"><rect width="64" height="64" fill="#fff"/><circle cx="39.36" cy="28.16" r="15.04" fill="#000"/></mask></defs><rect width="64" height="64" rx="15.36" fill="#141831"/><circle cx="32" cy="32" r="18.56" fill="#EDEBF5" mask="url(#m)"/></svg>';

function picture(markup: string, size: number, style?: CSSProperties) {
  return createElement('img', { src: `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`, width: size, height: size, alt: '', style });
}

function iconSvg(slug: ProductSlug): string {
  const { base, accent } = PRODUCT_ICONS[slug];
  const paths = (list: readonly string[], color: string, opacity: number) => list.map((d) => `<path d="${d}" stroke="${color}" stroke-opacity="${opacity}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="${ICON_STROKE}" stroke-linecap="round" stroke-linejoin="round">${paths(base, PALETTE.text, ICON_BASE_OPACITY)}${paths(accent, PALETTE.accent, 1)}</svg>`;
}

function art(icon: ProductSlug | undefined) {
  if (icon) return picture(iconSvg(icon), ICON_SIZE, { position: 'absolute', ...ICON_OFFSET });
  return picture(bodySvg('space', BODY_SIZE), BODY_SIZE, { position: 'absolute', ...BODY_OFFSET });
}

export type CardInput = { title: string; subtitle: string; icon?: ProductSlug };

export function card({ title, subtitle, icon }: CardInput): ReactElement {
  const glow = `radial-gradient(circle at 82% 22%, ${PALETTE.atmo}55 0%, ${PALETTE.night}00 55%)`;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: PALETTE.night, backgroundImage: glow, color: PALETTE.text, fontFamily: FONT, padding: PAD }}>
      {art(icon)}
      <div style={{ position: 'absolute', left: PAD, top: BRAND_TOP, display: 'flex', alignItems: 'center', gap: 16, fontSize: 18, letterSpacing: 4, textTransform: 'uppercase' }}>
        {picture(MARK, MARK_SIZE)}
        {SITE.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 22, maxWidth: TEXT_MAX_WIDTH }}>
        <div style={{ fontSize: title.length > TITLE.longFrom ? TITLE.small : TITLE.large, lineHeight: 1, letterSpacing: -2 }}>{title}</div>
        <div style={{ fontSize: 22, color: PALETTE.muted, lineHeight: 1.45 }}>{subtitle}</div>
      </div>
    </div>
  );
}
