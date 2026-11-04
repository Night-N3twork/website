import type { MouseEvent, ReactNode } from 'react';
import { Link, type LinkProps, useLocation, useNavigate } from 'react-router';
import type { Locale } from '@/i18n/locales';
import { splitLocale, localizePath } from '@/i18n/paths';
import { glide } from '@/motion/core';
import { activeController } from './active';
import { hashTarget, hashTop, splitHash } from './hash-target';

const EXTERNAL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

export interface TransitionLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  locale?: Locale;
  children?: ReactNode;
}

const modified = (e: MouseEvent): boolean => e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

export function TransitionLink({ to: target, locale, onClick, children, ...rest }: TransitionLinkProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const to = target.startsWith('/') ? localizePath(target, locale ?? splitLocale(pathname).locale) : target;
  if (EXTERNAL.test(to)) {
    return (
      <a href={to} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }
  const handle = (e: MouseEvent<HTMLAnchorElement>): void => {
    onClick?.(e);
    if (e.defaultPrevented || modified(e) || rest.target === '_blank') return;
    e.preventDefault();
    const { path, hash } = splitHash(to);
    if (path === pathname) {
      const anchor = hashTarget(hash);
      return glide(anchor ? hashTop(anchor) : 0);
    }
    const controller = activeController();
    if (controller) void controller.go(to);
    else void navigate(to);
  };
  return (
    <Link to={to} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
