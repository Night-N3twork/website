export function Statement({ text }: { text: string }) {
  return (
    <div className="statement">
      <p className="statement-text" data-words="">
        {text}
      </p>
    </div>
  );
}
