import { Chip, Eyebrow, Glare, pad, Section } from '../parts';
import type { FlagshipCopy, StageLabels } from './types';

export function Flagship({ copy, stages }: { copy: FlagshipCopy; stages: StageLabels }) {
  return (
    <Section frame="flagship" side="left" aria-labelledby="dusk-heading">
      <div className="copy">
        <Eyebrow>
          {copy.kicker} <Chip stage={copy.stage} label={stages[copy.stage]} />
        </Eyebrow>
        <h2 className="mega" id="dusk-heading" data-chars="">
          {copy.title}
        </h2>
        <p className="lede" data-reveal="">
          {copy.line}
        </p>
        <div className="term tilt">
          <div className="tilt-card cut" data-reveal="">
            <ol className="term-lines">
              {copy.notes.map((note, i) => (
                <li key={note}>
                  <span className="term-index">{pad(i + 1)}</span>
                  <span className="term-text" data-stream="">
                    {note}
                  </span>
                </li>
              ))}
            </ol>
            <span className="caret" aria-hidden="true" />
            <Glare />
          </div>
        </div>
      </div>
    </Section>
  );
}
