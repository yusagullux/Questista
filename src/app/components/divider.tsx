/* Horizontal divider with a centered label — used between OAuth and email form sections. */
export function Divider({ label }: { label: string }) {
  return (
    <div className="relative my-4 flex items-center" role="separator" aria-hidden>
      <div className="flex-1 border-t border-border" />
      <span className="px-3 text-xs text-subtle">{label}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}