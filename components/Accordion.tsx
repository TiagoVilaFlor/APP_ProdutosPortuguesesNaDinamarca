"use client";

export function Accordion({
  title,
  open,
  onToggle,
  children,
  anchorId,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  anchorId?: string;
}) {
  return (
    <section id={anchorId} className="rounded-2xl border border-neutral-200 bg-white">
      <button
        className="flex w-full items-center justify-between px-4 py-4 text-left"
        onClick={onToggle}
      >
        <span className="font-semibold">{title}</span>
        <span className="text-neutral-500">{open ? "–" : "+"}</span>
      </button>

      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}
