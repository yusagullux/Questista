/* Hairline divider with a centered mono label — broadsheet section break. */
export function Divider({ label }: { label: string }) {
  return (
    <div className="rule-label my-4" role="separator" aria-hidden>
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}