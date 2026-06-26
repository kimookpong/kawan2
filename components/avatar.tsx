/**
 * Avatar กลางของระบบ
 * - มี avatar_url → แสดงรูป, ไม่มี → อักษรย่อ
 * - role admin → วงแหวนสีทอง, editor → วงแหวนสีน้ำตาล (สีตามสิทธิ์)
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
          <img src={src} alt={name ?? ""} className="h-full w-full" />
        ) : (
          initial
        )}
      </span>
    </span>
  );
}
