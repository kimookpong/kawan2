"use client";

import { setListingStatus } from "@/app/marketplace/actions";

export function StatusSelector({
  listingId,
  current,
}: {
  listingId: number;
  current: string;
}) {
  return (
    <form action={setListingStatus}>
      <input type="hidden" name="listing_id" value={listingId} />
      <select
        name="status"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border border-outline-variant bg-surface px-2 py-1 text-xs"
      >
        <option value="available">ขายอยู่</option>
        <option value="reserved">จอง</option>
        <option value="sold">ขายแล้ว</option>
        <option value="hidden">ซ่อน</option>
      </select>
    </form>
  );
}
