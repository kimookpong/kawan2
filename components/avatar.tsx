/** ไอคอน shield-user (สไตล์ lucide) — ใช้ทั้ง admin/editor */
function ShieldUser({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="M6.376 18.91a6 6 0 0 1 11.249.003" />
      <circle cx="12" cy="11" r="4" />
    </svg>
  );
}

/**
 * Avatar กลางของระบบ
 * - มี avatar_url → แสดงรูป, ไม่มี → อักษรย่อ
 * - role admin → วงแหวนสีทอง + มงกุฎ, editor → วงแหวนสีน้ำตาล + ปากกา (border หนากว่าปกติ)
 */
export function Avatar({
  src,
  name,
  role,
  size = 36,
  className = "",
}: {
  src?: string | null;
  name?: string | null;
  role?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const ring =
    role === "admin"
      ? "ring-[3px] ring-amber-400"
      : role === "editor"
      ? "ring-[3px] ring-[#8a5a2b]"
      : "";

  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        className={`grid h-full w-full place-items-center overflow-hidden rounded-full bg-primary font-bold text-on-primary ${ring}`}
        style={{ fontSize: Math.round(size * 0.42) }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name ?? ""} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </span>
      <RoleMark role={role} size={size} />
    </span>
  );
}

function RoleMark({ role, size }: { role?: string | null; size: number }) {
  if (role !== "admin" && role !== "editor") return null;
  const color = role === "admin" ? "text-amber-500" : "text-[#8a5a2b]";
  const badge = Math.max(15, Math.round(size * 0.45));
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-surface-container-lowest ring-1 ring-outline-variant"
      style={{ width: badge, height: badge }}
      title={role === "admin" ? "ผู้ดูแลระบบ" : "บรรณาธิการ"}
    >
      <ShieldUser className={color} size={Math.round(badge * 0.68)} />
    </span>
  );
}
