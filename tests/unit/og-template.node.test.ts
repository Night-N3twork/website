import { describe, expect, it } from 'vitest';
import { ogImage, OG_SIZE } from '@/lib/og/template';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const IHDR_WIDTH_OFFSET = 16;
const IHDR_HEIGHT_OFFSET = 20;

describe('ogImage', () => {
  it('renders a share card as a PNG at the share size', async () => {
    const response = await ogImage({ title: 'Dusk', subtitle: 'A runtime in a tab.', icon: 'dusk' });
    expect(response.headers.get('content-type')).toBe('image/png');
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.subarray(0, 4)]).toEqual(PNG_SIGNATURE);
    const header = new DataView(bytes.buffer);
    expect({ width: header.getUint32(IHDR_WIDTH_OFFSET), height: header.getUint32(IHDR_HEIGHT_OFFSET) }).toEqual(OG_SIZE);
  });
});
