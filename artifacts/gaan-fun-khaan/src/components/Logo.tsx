interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const dims: Record<string, { w: number; h: number }> = {
    sm: { w: 80, h: 36 },
    md: { w: 110, h: 48 },
    lg: { w: 150, h: 66 },
  };
  const { w, h } = dims[size];

  return (
    <div
      className={`rounded-lg overflow-hidden shrink-0 ${className}`}
      style={{
        width: w,
        height: h,
        backgroundImage: "url('/restaurant-logo.jpg')",
        backgroundSize: "320% auto",
        backgroundPosition: "50% 13%",
        backgroundRepeat: "no-repeat",
      }}
      role="img"
      aria-label="Gaan Fun Khaan logo"
    />
  );
}
