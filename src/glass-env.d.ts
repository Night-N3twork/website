/// <reference types="vite/client" />

declare const __GLASS_BACKDROP__: 'range' | 'peak';

declare module 'virtual:docs-pages' {
  import type { MDXContent } from 'mdx/types';

  const pages: Readonly<Record<string, () => Promise<{ default: MDXContent }>>>;
  export default pages;
}
