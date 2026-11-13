import { z } from 'zod';

const schema = z.strictObject({
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  draft: z.boolean().optional(),
  sidebar: z.strictObject({ order: z.number().optional(), label: z.string().min(1).optional() }).optional(),
});

export type Frontmatter = z.infer<typeof schema>;

export function readFrontmatter(value: unknown, file: string): Frontmatter {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error(`invalid docs frontmatter in ${file}: ${parsed.error.message}`);
  return parsed.data;
}
