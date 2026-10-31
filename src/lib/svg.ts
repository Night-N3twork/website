import { Fragment, isValidElement, type ReactNode } from 'react';

const KEBAB = new Set([
  'clipPath',
  'clipRule',
  'dominantBaseline',
  'fillOpacity',
  'fillRule',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'letterSpacing',
  'paintOrder',
  'shapeRendering',
  'stopColor',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeLinecap',
  'strokeLinejoin',
  'strokeOpacity',
  'strokeWidth',
  'textAnchor',
  'vectorEffect',
]);
const PASSTHROUGH = new Set([
  'baseFrequency',
  'clipPathUnits',
  'filterUnits',
  'gradientTransform',
  'gradientUnits',
  'lengthAdjust',
  'markerHeight',
  'markerUnits',
  'markerWidth',
  'maskContentUnits',
  'maskUnits',
  'numOctaves',
  'pathLength',
  'patternContentUnits',
  'patternTransform',
  'patternUnits',
  'preserveAspectRatio',
  'primitiveUnits',
  'refX',
  'refY',
  'spreadMethod',
  'startOffset',
  'stdDeviation',
  'stitchTiles',
  'textLength',
  'viewBox',
]);
const RENAME: Record<string, string> = { className: 'class' };
const SKIP = new Set(['children', 'key', 'ref']);
const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

function escape(value: string): string {
  return value.replace(/[&<>"]/g, (ch) => ESCAPES[ch]);
}

function attributeName(prop: string): string {
  if (RENAME[prop]) return RENAME[prop];
  if (KEBAB.has(prop)) return prop.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
  if (PASSTHROUGH.has(prop) || !/[A-Z]/.test(prop)) return prop;
  throw new Error(`toSvg does not know the ${prop} attribute`);
}

function attribute(name: string, value: unknown): string {
  if (typeof value === 'object') throw new Error(`toSvg cannot serialise the ${name} prop`);
  return ` ${attributeName(name)}="${escape(String(value))}"`;
}

function attributes(props: Record<string, unknown>): string {
  return Object.entries(props)
    .filter(([name, value]) => !SKIP.has(name) && value !== undefined && value !== null && value !== false)
    .map(([name, value]) => attribute(name, value))
    .join('');
}

export function toSvg(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return escape(String(node));
  if (Array.isArray(node)) return node.map(toSvg).join('');
  if (!isValidElement(node)) throw new Error('toSvg received a node that is not a React element');
  const props = node.props as Record<string, unknown> & { children?: ReactNode };
  if (node.type === Fragment) return toSvg(props.children);
  if (typeof node.type === 'function') return toSvg((node.type as (p: Record<string, unknown>) => ReactNode)(props));
  if (typeof node.type !== 'string') throw new Error(`toSvg cannot expand a ${typeof node.type} element type`);
  const inner = toSvg(props.children);
  return inner ? `<${node.type}${attributes(props)}>${inner}</${node.type}>` : `<${node.type}${attributes(props)}/>`;
}
