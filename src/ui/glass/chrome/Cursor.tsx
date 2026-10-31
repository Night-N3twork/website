export function Cursor() {
  return (
    <div className="cursor" aria-hidden="true">
      <span className="cursor-ring" />
      <svg className="cursor-icon" width={22} height={22} viewBox="0 0 22 22">
        <path d="M4.5 9.5a7 7 0 0 1 12.4-3.4M17.5 12.5a7 7 0 0 1-12.4 3.4" />
        <path d="M17.4 2.6v3.9h-3.9M4.6 19.4v-3.9h3.9" />
      </svg>
    </div>
  );
}
