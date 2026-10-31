import { PeopleGroup, type PeopleGroupView, PeopleList } from './RoleGroups';

export interface TiersCopy {
  title: string;
  name: string;
  price: string;
  perks: string[];
}

export function SupporterGroups({ label, groups, tiers }: { label: string; groups: PeopleGroupView[]; tiers: TiersCopy }) {
  return (
    <PeopleList label={label}>
      {groups.map((group) => (
        <PeopleGroup key={group.key} group={group} />
      ))}
      <article className="people-tiers note cut" data-reveal="">
        <h2 className="note-title">{tiers.title}</h2>
        <div className="tier-head">
          <h3 className="tier-name">{tiers.name}</h3>
          <p className="tier-price">{tiers.price}</p>
        </div>
        <ul className="tier-perks">
          {tiers.perks.map((perk) => (
            <li key={perk}>{perk}</li>
          ))}
        </ul>
      </article>
    </PeopleList>
  );
}
