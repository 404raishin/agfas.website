export function Section({
  children,
  className = "",
  tone = "paper",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "paper" | "mist";
}) {
  return (
    <section className={tone === "mist" ? "bg-mist" : "bg-paper"}>
      <div className={`mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24 ${className}`}>{children}</div>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-3xl sm:text-4xl">{title}</h2>
      {lead && <p className="mt-4 text-base leading-relaxed text-steel sm:text-lg">{lead}</p>}
    </div>
  );
}
