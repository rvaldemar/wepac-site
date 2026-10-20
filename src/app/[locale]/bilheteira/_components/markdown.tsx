import ReactMarkdown from "react-markdown";

// Event and tier copy is written by the team in the admin. Raw HTML is never
// rendered (react-markdown escapes it by default); links open safely.
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`bilheteira-prose ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0 leading-[1.7]">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-[var(--ev-ink)]">{children}</strong>,
          ul: ({ children }) => <ul className="mb-4 list-disc pl-5 space-y-1.5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal pl-5 space-y-1.5">{children}</ol>,
          h2: ({ children }) => (
            <h3 className="font-barlow font-black text-[22px] tracking-[-0.01em] mt-8 mb-3">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="font-barlow font-bold text-[18px] mt-6 mb-2">{children}</h4>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="underline underline-offset-2 hover:text-[var(--ev-ink)]"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
