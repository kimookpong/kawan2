import Link from "next/link";
import { MapPin } from "lucide-react";
import { NEWS_FALLBACK_IMG } from "@/lib/constants";
import { CONDITION_LABEL, formatPrice } from "@/lib/marketplace";

export type Listing = {
  id: number;
  title: string;
  cover_url: string | null;
  price: number | null;
  price_type: string;
  condition: string;
  status: string;
  provinces?: { name_th: string } | null;
  marketplace_categories?: { name_th: string } | null;
};

export function ListingCard({ l }: { l: Listing }) {
  const isSold = l.status === "sold";
  return (
    <Link
      href={`/marketplace/listing/${l.id}`}
      className="card group relative overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={l.cover_url || NEWS_FALLBACK_IMG}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {isSold && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <span className="rounded-full bg-error px-4 py-1 text-sm font-bold text-on-error">
              ขายแล้ว
            </span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
          {CONDITION_LABEL[l.condition] ?? l.condition}
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium text-on-surface group-hover:text-primary">
          {l.title}
        </p>
        <p className="mt-1 text-base font-bold text-primary">
          {formatPrice(l.price, l.price_type)}
        </p>
        <div className="mt-1 flex items-center justify-between text-[11px] text-on-surface-variant">
          {l.marketplace_categories?.name_th && (
            <span className="truncate">{l.marketplace_categories.name_th}</span>
          )}
          {l.provinces?.name_th && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {l.provinces.name_th}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
