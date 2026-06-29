/**
 * BBCode → HTML แบบปลอดภัย
 * หลักการ: escape HTML ของผู้ใช้ทั้งหมดก่อน แล้วค่อยแปลงเฉพาะแท็ก BBCode ที่อนุญาต
 * → HTML ที่ออกมามาจากโค้ดเราเท่านั้น (กัน XSS), URL จำกัดเฉพาะ http(s)
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const URL_RE = "(https?:\\/\\/[^\\s\\[\\]\"]+)";

function unescapeUrl(x: string): string {
  return x.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}
const FB_HOST = /^https?:\/\/(([\w-]+\.)*facebook\.com|fb\.watch)\//i;

export function renderBBCode(input: string | null | undefined): string {
  if (!input) return "";
  let s = escapeHtml(input);

  // ===== Embeds: Facebook โพสต์/คลิป, TikTok =====
  s = s.replace(/\[fbpost\]\s*([^\[\]\s]+)\s*\[\/fbpost\]/gi, (m, u: string) => {
    const raw = unescapeUrl(u);
    if (!FB_HOST.test(raw)) return m;
    const src = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(raw)}&amp;show_text=true&amp;width=500`;
    return `<span class="bbcode-fb"><iframe src="${src}" scrolling="no" frameborder="0" allowfullscreen loading="lazy"></iframe></span>`;
  });
  s = s.replace(/\[fbvideo\]\s*([^\[\]\s]+)\s*\[\/fbvideo\]/gi, (m, u: string) => {
    const raw = unescapeUrl(u);
    if (!FB_HOST.test(raw)) return m;
    const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(raw)}&amp;show_text=false`;
    return `<span class="bbcode-fb bbcode-fb-video"><iframe src="${src}" scrolling="no" frameborder="0" allowfullscreen loading="lazy"></iframe></span>`;
  });
  s = s.replace(/\[tiktok\]\s*([^\[\]\s]+)\s*\[\/tiktok\]/gi, (m, u: string) => {
    const raw = unescapeUrl(u);
    const idm = raw.match(/\/(?:video|photo)\/(\d{6,})/) || raw.match(/^(\d{6,})$/);
    if (!idm) return m;
    return `<span class="bbcode-tiktok"><iframe src="https://www.tiktok.com/embed/v2/${idm[1]}" scrolling="no" frameborder="0" allowfullscreen loading="lazy"></iframe></span>`;
  });

  // รูปภาพ [img]url[/img]
  s = s.replace(
    new RegExp(`\\[img\\]\\s*${URL_RE}\\s*\\[\\/img\\]`, "gi"),
    '<img src="$1" alt="" class="bbcode-img" loading="lazy" />'
  );

  // YouTube [youtube]id[/youtube]
  s = s.replace(
    /\[youtube\]\s*([\w-]{6,20})\s*\[\/youtube\]/gi,
    '<span class="bbcode-embed"><iframe src="https://www.youtube.com/embed/$1" allowfullscreen loading="lazy"></iframe></span>'
  );

  // ลิงก์ [url=href]text[/url] และ [url]href[/url]
  s = s.replace(
    new RegExp(`\\[url=\\s*${URL_RE}\\s*\\]([\\s\\S]*?)\\[\\/url\\]`, "gi"),
    '<a href="$1" target="_blank" rel="nofollow noopener">$2</a>'
  );
  s = s.replace(
    new RegExp(`\\[url\\]\\s*${URL_RE}\\s*\\[\\/url\\]`, "gi"),
    '<a href="$1" target="_blank" rel="nofollow noopener">$1</a>'
  );

  // สี [color=#hex|name]
  s = s.replace(
    /\[color=\s*(#[0-9a-fA-F]{3,6}|[a-zA-Z]{3,20})\s*\]([\s\S]*?)\[\/color\]/gi,
    '<span style="color:$1">$2</span>'
  );

  // ขนาด [size=n]  (1–7 → px, หรือเลข px ตรงๆ)
  s = s.replace(/\[size=\s*(\d{1,3})\s*\]([\s\S]*?)\[\/size\]/gi, (_m, n: string, txt: string) => {
    const num = parseInt(n, 10);
    const px = Math.min(40, Math.max(10, num <= 7 ? 10 + num * 4 : num));
    return `<span style="font-size:${px}px">${txt}</span>`;
  });

  // แท็กพื้นฐาน + nested (วนหลายรอบ)
  const simple: [string, string][] = [
    ["b", "strong"],
    ["i", "em"],
    ["u", "u"],
    ["s", "del"],
  ];
  for (let k = 0; k < 4; k++) {
    for (const [bb, html] of simple) {
      s = s.replace(new RegExp(`\\[${bb}\\]([\\s\\S]*?)\\[\\/${bb}\\]`, "gi"), `<${html}>$1</${html}>`);
    }
    // อ้างอิงแบบมีชื่อผู้พูด [quote=name]...[/quote]
    s = s.replace(/\[quote=([^\]\n]{1,60})\]([\s\S]*?)\[\/quote\]/gi,
      '<blockquote class="bbcode-quote"><span class="bbcode-quote-by">$1 เขียนว่า:</span>$2</blockquote>');
    s = s.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="bbcode-quote">$1</blockquote>');
    s = s.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '<code class="bbcode-code">$1</code>');
    s = s.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, '<span class="bbcode-spoiler">$1</span>');
  }

  // mention @username → ลิงก์โปรไฟล์ (กันชนกับอีเมล โดยต้องไม่มีตัวอักษร/เลขนำหน้า)
  s = s.replace(/(^|[^A-Za-z0-9_/@])@([A-Za-z0-9_]{3,30})/g,
    '$1<a href="/u/$2" class="bbcode-mention">@$2</a>');

  // ขึ้นบรรทัดใหม่
  s = s.replace(/\r?\n/g, "<br />");
  return s;
}
