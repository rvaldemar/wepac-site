export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
  };

  return (
    <svg
      className={`${sizes[size]} w-auto ${className}`}
      viewBox="0 0 200 60"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="0"
        y="48"
        fontFamily="'Barlow', sans-serif"
        fontWeight="900"
        fontSize="56"
        letterSpacing="-2"
      >
        wepac
      </text>
    </svg>
  );
}

export function LogoFull({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Simplified zigzag icon */}
      <div className="relative flex h-8 w-10 items-center justify-center bg-current">
        <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-wepac-black" />
        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-wepac-black" />
      </div>
      <span className="font-barlow text-2xl font-bold tracking-tight">wepac</span>
    </div>
  );
}
