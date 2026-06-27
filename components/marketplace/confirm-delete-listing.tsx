"use client";

import { Trash2 } from "lucide-react";
import { setListingStatus } from "@/app/marketplace/actions";

export function ConfirmDeleteListing({ listingId }: { listingId: number }) {
  return (
    <form action={setListingStatus}>
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="status" value="deleted" />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("ลบประกาศนี้?")) e.preventDefault();
        }}
        className="rounded border border-outline-variant p-1.5 text-error hover:bg-error-container"
        aria-label="ลบ"
        title="ลบ"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
