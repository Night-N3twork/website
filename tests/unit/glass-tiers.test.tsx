import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SupporterGroups } from '@/ui/glass/people/SupporterGroups';

const TIERS = { title: 'Tiers', name: 'Plus', price: '$5 a month', perks: ['First perk', 'Second perk'] };

describe('SupporterGroups', () => {
  it('lists the paid tier with its price and every perk', () => {
    render(<SupporterGroups label="Supporters" groups={[]} tiers={TIERS} />);
    const card = screen.getByRole('heading', { name: 'Tiers' }).closest('article') as HTMLElement;
    expect(within(card).getByRole('heading', { name: 'Plus' })).toBeTruthy();
    expect(within(card).getByText('$5 a month')).toBeTruthy();
    expect(within(card).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['First perk', 'Second perk']);
    expect(card.querySelector('.note-caret')).toBeNull();
  });
});
