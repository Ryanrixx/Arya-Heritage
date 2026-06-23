import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/payments/money";

export interface CardProps {
  title: string;
  subtitle?: string | null;
  imageSrc: string;
  imageAlt?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  href?: string;
  className?: string;
}

export default function Card({
  title,
  subtitle,
  imageSrc,
  imageAlt = title,
  minPrice,
  maxPrice,
  href,
  className = "",
}: CardProps) {
  const priceLabel =
    minPrice == null
      ? null
      : maxPrice != null && maxPrice !== minPrice
      ? `${formatINR(minPrice)} – ${formatINR(maxPrice)}`
      : formatINR(minPrice);

  const content = (
    <article className={`card ${className}`} style={{ cursor: href ? "pointer" : "default" }}>
      <div style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", background: "var(--cream-dark)" }}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 1280px) 320px, (min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
          style={{ objectFit: "cover", transition: "transform 0.35s ease" }}
          className="group-hover:scale-105"
        />
      </div>
      <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
        {subtitle && (
          <p style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold-muted)", margin: "0 0 0.35rem" }}>
            {subtitle}
          </p>
        )}
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--navy)", margin: 0, lineHeight: 1.3 }}>{title}</h3>
        {priceLabel && (
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", margin: "0.5rem 0 0" }}>
            {priceLabel}
          </p>
        )}
      </div>
    </article>
  );

  return href ? (
    <Link href={href} aria-label={title} className="group block" style={{ textDecoration: "none" }}>
      {content}
    </Link>
  ) : (
    content
  );
}
