import { getProject, PROJECTS, type Project } from '@/content/projects';

const DEFAULT_LIMIT = 3;

export function relatedProjects(slug: string, limit = DEFAULT_LIMIT): Project[] {
  const self = getProject(slug);
  if (!self) return [];
  const declared = [...new Set(self.related)]
    .filter((s) => s !== slug)
    .map((s) => getProject(s))
    .filter((p): p is Project => p !== undefined);
  const fill = PROJECTS.filter((p) => p.slug !== slug && !declared.includes(p));
  return [...declared, ...fill].slice(0, limit);
}
