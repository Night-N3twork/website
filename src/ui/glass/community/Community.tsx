import { ExternalLink } from '../chrome/ExternalLink';
import { Button, Chevron, Glare, pad, Section } from '../parts';

export interface CommunityLink {
  href: string;
  label: string;
}

export interface CommunityPartner {
  id: string;
  name: string;
  url: string;
  host: string;
}

export interface CommunityCopy {
  kicker: string;
  title: string;
  lede: string;
  links: CommunityLink[];
  contribute: string;
  contributeLede: string;
  conduct: string;
  conductPending: string;
  partnersTitle: string;
  partnersLede: string;
  partners: CommunityPartner[];
}

function Note({ title, text, pending = false }: { title: string; text: string; pending?: boolean }) {
  return (
    <article className={pending ? 'note cut is-pending' : 'note cut'} data-reveal="">
      <h2 className="note-title">{title}</h2>
      <p className="note-text">
        {text}
        {pending ? <span className="note-caret" aria-hidden="true" /> : null}
      </p>
    </article>
  );
}

function Partner({ partner, n }: { partner: CommunityPartner; n: number }) {
  return (
    <li>
      <ExternalLink className="partner cut" href={partner.url}>
        <span className="partner-num">{pad(n)}</span>
        <span className="partner-name">{partner.name}</span>
        <span className="partner-host">
          {partner.host}
          <Chevron />
        </span>
        <Glare />
      </ExternalLink>
    </li>
  );
}

export function Community({ copy }: { copy: CommunityCopy }) {
  return (
    <>
      <Section frame="page" side="left" aria-labelledby="page-heading">
        <div className="copy">
          <p className="eyebrow" data-intro="">
            {copy.kicker}
          </p>
          <h1 className="page-title" id="page-heading" tabIndex={-1} data-intro="headline">
            {copy.title}
          </h1>
          <p className="lede" data-intro="">
            {copy.lede}
          </p>
          <div className="actions" data-intro="">
            {copy.links.map((link, i) => (
              <Button key={link.href} kind={i ? 'ghost' : 'primary'} to={link.href}>
                {link.label}
              </Button>
            ))}
          </div>
        </div>
      </Section>
      <Section frame="list" side="left" aria-label={copy.contribute}>
        <div className="notes">
          <Note title={copy.contribute} text={copy.contributeLede} />
          <Note title={copy.conduct} text={copy.conductPending} pending />
        </div>
      </Section>
      <Section frame="related" side="left" aria-labelledby="partners-heading">
        <div className="copy partners-copy">
          <h2 className="title" id="partners-heading" data-split="">
            {copy.partnersTitle}
          </h2>
          <p className="lede" data-reveal="">
            {copy.partnersLede}
          </p>
        </div>
        <ul className="partners" data-reveal="children">
          {copy.partners.map((partner, i) => (
            <Partner key={partner.id} partner={partner} n={i + 1} />
          ))}
        </ul>
      </Section>
    </>
  );
}
