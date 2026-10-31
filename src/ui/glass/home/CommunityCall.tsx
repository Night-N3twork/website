import { SITE } from '@/content/site';
import { Button, Section } from '../parts';
import type { CommunityCallCopy } from './types';

export function CommunityCall({ copy }: { copy: CommunityCallCopy }) {
  return (
    <Section frame="community" side="center" id="community" aria-labelledby="community-heading">
      <div className="copy">
        <h2 className="display" id="community-heading" data-split="">
          {copy.title}
        </h2>
        <p className="lede" data-reveal="">
          {copy.lede}
        </p>
        <div className="actions" data-reveal="children">
          <Button kind="primary" to={SITE.discord}>
            {copy.discord}
          </Button>
          <Button kind="ghost" to={SITE.github}>
            GitHub
          </Button>
          <Button kind="ghost" to={SITE.gitlab}>
            GitLab
          </Button>
        </div>
      </div>
    </Section>
  );
}
