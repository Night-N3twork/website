import { describe, expect, it } from 'vitest';
import { OG_SIZE } from '@/lib/og/template';
import { loader as homeLoader } from '@/app/routes/og.site';
import { loader as projectLoader } from '@/app/routes/og.project';
import { routeArgs } from '../helpers/route-args';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const IHDR_WIDTH_OFFSET = 16;
const IHDR_HEIGHT_OFFSET = 20;

const context = (params: Record<string, string | undefined>) => params;
const homeCard = (params: Record<string, string | undefined>) => homeLoader(routeArgs(params));
const projectCard = (params: Record<string, string | undefined>) => projectLoader(routeArgs(params));

async function sizeOf(response: Response) {
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect([...bytes.subarray(0, 4)]).toEqual(PNG_SIGNATURE);
  const header = new DataView(bytes.buffer);
  return { width: header.getUint32(IHDR_WIDTH_OFFSET), height: header.getUint32(IHDR_HEIGHT_OFFSET) };
}

describe('share card routes', () => {
  it('draws the home card for each locale at the share size', async () => {
    const response = await homeCard(context({ locale: 'ja' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(await sizeOf(response)).toEqual(OG_SIZE);
  });

  it('draws a card for a known project', async () => {
    const response = await projectCard(context({ locale: 'fr', slug: 'dusk' }));
    expect(response.status).toBe(200);
    expect(await sizeOf(response)).toEqual(OG_SIZE);
  });

  it('answers 404 for a locale or a project it does not know', async () => {
    expect((await homeCard(context({ locale: 'de' }))).status).toBe(404);
    expect((await homeCard(context({ locale: 'toString' }))).status).toBe(404);
    expect((await projectCard(context({ locale: 'en', slug: 'nope' }))).status).toBe(404);
    expect((await projectCard(context({ locale: 'de', slug: 'dusk' }))).status).toBe(404);
    expect((await projectCard(context({ locale: 'en', slug: '__proto__' }))).status).toBe(404);
  });
});
