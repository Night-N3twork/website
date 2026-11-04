import { describe, expect, it } from 'vitest';
import { LEGAL_FACTS, factText, fillFacts, legalStage, type LegalFacts } from '@/content/legal-facts';

const OPEN = LEGAL_FACTS;

const RESOLVED: LegalFacts = {
  governingState: { status: 'resolved', value: 'Delaware' },
  ticketChannel: { status: 'resolved', value: 'the ticket channel' },
  responder: { status: 'resolved', value: 'the owner' },
  captchaFields: { status: 'resolved', value: 'the page address' },
  noOtherDestinationLogs: { status: 'resolved', value: true },
  appLogs: { status: 'resolved', value: 'thirty days' },
  mullvadLive: { status: 'resolved', value: false },
};

describe('legal stage', () => {
  it('holds the pages while any fact is open', () => expect(legalStage(OPEN, false)).toBe('held'));

  it('previews open facts only when asked', () => expect(legalStage(OPEN, true)).toBe('preview'));

  it('goes live once every fact is resolved, preview or not', () => {
    expect(legalStage(RESOLVED, false)).toBe('live');
    expect(legalStage(RESOLVED, true)).toBe('live');
  });

  it('stays held when a single fact is still open', () => {
    expect(legalStage({ ...RESOLVED, appLogs: { status: 'open' } }, false)).toBe('held');
  });

  it('treats a resolved false as resolved', () => {
    expect(RESOLVED.mullvadLive).toEqual({ status: 'resolved', value: false });
    expect(legalStage(RESOLVED, false)).toBe('live');
  });
});

describe('fact text', () => {
  it('renders an open fact as a loud marker and a resolved one as text', () => {
    expect(factText(OPEN, 'governingState')).toBe('⟦open: governingState⟧');
    expect(factText({ ...RESOLVED, governingState: { status: 'resolved', value: 'Delaware' } }, 'governingState')).toBe('Delaware');
  });

  it('stringifies resolved booleans', () => {
    expect(factText(RESOLVED, 'mullvadLive')).toBe('false');
    expect(factText(RESOLVED, 'noOtherDestinationLogs')).toBe('true');
  });

  it('fills fact tokens and leaves other braces alone', () => {
    expect(fillFacts('Law of {fact:governingState}; {x}', OPEN)).toBe('Law of ⟦open: governingState⟧; {x}');
  });

  it('fills every occurrence and ignores keys that are not facts', () => {
    expect(fillFacts('{fact:responder} and {fact:responder}, not {fact:nothing}', RESOLVED)).toBe('the owner and the owner, not {fact:nothing}');
  });
});

describe('release gate', () => {
  it.skipIf(!process.env.LEGAL_RELEASE)('every fact is resolved before release', () => {
    expect(legalStage(LEGAL_FACTS, false)).toBe('live');
  });
});
