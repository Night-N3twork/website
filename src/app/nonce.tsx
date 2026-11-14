import { createContext as createReactContext, useContext, type ReactNode } from 'react';
import { createContext as createRouterContext, RouterContextProvider } from 'react-router';

const NONCE_KEY = Symbol.for('__glass_nonce_context__');
type RouterContext = ReturnType<typeof createRouterContext<string>>;

export const nonceContext: RouterContext =
  ((globalThis as unknown as Record<symbol, unknown>)[NONCE_KEY] as RouterContext | undefined) ??
  (((globalThis as unknown as Record<symbol, unknown>)[NONCE_KEY] = createRouterContext<string>('')) as RouterContext);

export function contextWithNonce(nonce: string): RouterContextProvider {
  const provider = new RouterContextProvider();
  provider.set(nonceContext, nonce);
  return provider;
}

const NonceReactContext = createReactContext<string>('');

export function NonceProvider({ value, children }: { value: string; children: ReactNode }) {
  return <NonceReactContext.Provider value={value}>{children}</NonceReactContext.Provider>;
}

let pageNonce: string | null = null;

function readPageNonce(): string {
  pageNonce ??= typeof document === 'undefined' ? '' : (document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce ?? '');
  return pageNonce;
}

export function useNonce(): string {
  return useContext(NonceReactContext) || readPageNonce();
}
