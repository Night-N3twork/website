export const BODY_KINDS = ['space', 'daydream', 'lunar', 'daylight', 'solar', 'aurora', 'umbra', 'nyx', 'linkarchive'] as const;

export type BodyKind = (typeof BODY_KINDS)[number];
