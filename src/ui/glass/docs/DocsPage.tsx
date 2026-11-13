import { createElement, memo, Suspense } from 'react';
import type { DocsPageData } from '@/lib/docs/page';
import { Section } from '../parts';
import { docContent } from './content';
import { DocsDirectory } from './DocsDirectory';
import { DocsNav } from './DocsNav';
import { DocsPager } from './DocsPager';
import { DocsToc } from './DocsToc';
import { DocsLabelsContext } from './labels';
import { MDX_COMPONENTS } from './mdx';

function DocsHeader({ data }: { data: DocsPageData }) {
  const home = data.slug === '';
  return (
    <Section frame="page" look={home ? 'docs-home' : 'docs-head'} side="left" aria-labelledby="page-heading">
      <div className="copy">
        <p className="eyebrow" data-intro="" lang={home ? undefined : 'en'}>
          {home ? data.labels.docs : data.trail.join(' / ') || data.labels.docs}
        </p>
        <h1 className="page-title docs-title" id="page-heading" tabIndex={-1} data-intro="headline" lang="en">
          {data.title}
        </h1>
        {data.description ? (
          <p className="lede" data-intro="" lang="en">
            {data.description}
          </p>
        ) : null}
        {data.labels.notice ? (
          <p className="docs-notice" data-intro="">
            {data.labels.notice}
          </p>
        ) : null}
      </div>
    </Section>
  );
}

const DocBody = memo(function DocBody({ file }: { file: string }) {
  return (
    <div className="docs-prose" lang="en" data-doc={file}>
      <Suspense fallback={null}>{createElement(docContent(file), { components: MDX_COMPONENTS })}</Suspense>
    </div>
  );
});

export function DocsPage({ data }: { data: DocsPageData }) {
  const contents = data.toc.length > 0;
  return (
    <DocsLabelsContext value={data.labels}>
      <DocsHeader data={data} />
      <Section frame="list" look="docs" side="left">
        <div className="docs" data-contents={contents || undefined}>
          <DocsNav nodes={data.nav} current={data.slug} label={data.labels.browse} />
          <article className="docs-article" aria-labelledby="page-heading">
            <DocBody file={data.file} />
            {data.directory ? <DocsDirectory sections={data.directory} /> : null}
            <DocsPager pager={data.pager} labels={data.labels} />
          </article>
          {contents ? <DocsToc entries={data.toc} label={data.labels.contents} /> : null}
        </div>
      </Section>
    </DocsLabelsContext>
  );
}
