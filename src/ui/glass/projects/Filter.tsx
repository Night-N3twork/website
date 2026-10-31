import { useRef } from 'react';
import type { ProductGroup } from '@/content/projects';
import { pad, Reel } from '../parts';
import { usePill } from '../pill';

export type FilterValue = 'all' | ProductGroup;

export interface FilterOption {
  value: FilterValue;
  label: string;
  count: number;
}

interface FilterProps {
  label: string;
  options: FilterOption[];
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

export function Filter({ label, options, value, onChange }: FilterProps) {
  const list = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  usePill(pill, list, '[aria-pressed="true"]', value);
  return (
    <div className="filter seg cut" role="group" aria-label={label} data-intro="" ref={list}>
      <span className="seg-pill" aria-hidden="true" ref={pill} />
      {options.map((option) => (
        <button key={option.value} type="button" data-filter={option.value} aria-pressed={option.value === value} onClick={() => onChange(option.value)}>
          <span>{option.label}</span>
          <Reel text={pad(option.count)} label={` ${option.count}`} className="filter-count" />
        </button>
      ))}
    </div>
  );
}
