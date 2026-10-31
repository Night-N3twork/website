import { isRouteErrorResponse, useRouteError, useRouteLoaderData } from 'react-router';
import { Button, Reel, Section } from './parts';

export interface LostPageCopy {
  title: string;
  lede: string;
  cta: string;
}

const SERVER_ERROR = 500;
const FALLBACK: LostPageCopy = { title: 'Page not found', lede: '', cta: '' };

type ErrorCopyKey = 'notFound' | 'serverError';

export const errorStatus = (error: unknown): number => (isRouteErrorResponse(error) ? error.status : SERVER_ERROR);
export const copyKey = (status: number): ErrorCopyKey => (status >= SERVER_ERROR ? 'serverError' : 'notFound');

export function useLostCopy(status = 404): LostPageCopy {
  const root = useRouteLoaderData('root') as Partial<Record<ErrorCopyKey, LostPageCopy>> | undefined;
  return root?.[copyKey(status)] ?? FALLBACK;
}

export function Lost({ status, copy }: { status: number; copy: LostPageCopy }) {
  return (
    <Section frame={status >= SERVER_ERROR ? 'fault' : 'lost'} look="lost" side="center" aria-labelledby="page-heading">
      <div className="copy">
        <p className="lost-code" data-intro="">
          <Reel text={String(status)} className="lost-reel" />
        </p>
        <h1 className="display lost-title" id="page-heading" tabIndex={-1} data-intro="headline">
          {copy.title}
        </h1>
        {copy.lede ? (
          <p className="lede" data-intro="">
            {copy.lede}
          </p>
        ) : null}
        {copy.cta ? (
          <div className="actions" data-intro="">
            <Button kind="primary" to="/projects">
              {copy.cta}
            </Button>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

export function RouteError() {
  const status = errorStatus(useRouteError());
  const copy = useLostCopy(status);
  return <Lost status={status} copy={copy} />;
}
