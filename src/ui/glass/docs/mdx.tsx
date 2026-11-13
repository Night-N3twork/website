import type { MDXComponents } from 'mdx/types';
import { type ComponentProps, isValidElement, type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import { TransitionLink } from '@/navigation/TransitionLink';
import { useDocsLabels } from './labels';

type CopyState = 'idle' | 'copied' | 'failed';

const RESET_MS = 1600;
const WEB = /^(?:https?:)?\/\//i;

function DocAnchor({ href = '', className, children }: ComponentProps<'a'>) {
  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <TransitionLink to={href} className={className}>
        {children}
      </TransitionLink>
    );
  }
  const external = WEB.test(href) ? { target: '_blank', rel: 'noopener' } : {};
  return (
    <a href={href} className={className} {...external}>
      {children}
    </a>
  );
}

function languageOf(children: ReactNode): string | null {
  if (!isValidElement<{ className?: string }>(children)) return null;
  return /language-([\w+-]+)/.exec(children.props.className ?? '')?.[1] ?? null;
}

function CopyButton({ source }: { source: RefObject<HTMLPreElement | null> }) {
  const labels = useDocsLabels();
  const [state, setState] = useState<CopyState>('idle');
  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), RESET_MS);
    return () => clearTimeout(timer);
  }, [state]);
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText((source.current?.textContent ?? '').replace(/\n$/, ''));
      setState('copied');
    } catch {
      setState('failed');
    }
  };
  const text = { idle: labels.copy, copied: labels.copied, failed: labels.copyFailed }[state];
  return (
    <button type="button" className="doc-code-copy" lang={labels.lang} data-state={state} onClick={() => void copy()}>
      <span aria-live="polite">{text}</span>
    </button>
  );
}

function DocCode({ children, className }: ComponentProps<'pre'>) {
  const pre = useRef<HTMLPreElement>(null);
  return (
    <figure className="doc-code cut">
      <figcaption className="doc-code-bar">
        <span className="doc-code-lang">{languageOf(children) ?? 'text'}</span>
        <CopyButton source={pre} />
      </figcaption>
      <pre ref={pre} className={className} tabIndex={0}>
        {children}
      </pre>
    </figure>
  );
}

function DocTable(props: ComponentProps<'table'>) {
  return (
    <div className="doc-table" tabIndex={0}>
      <table {...props} />
    </div>
  );
}

export const MDX_COMPONENTS: MDXComponents = { a: DocAnchor, pre: DocCode, table: DocTable };
