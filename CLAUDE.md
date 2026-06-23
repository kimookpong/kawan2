# kawan2 — บันทึกแนวทางการทำงาน

## UX/UI conventions
- **เนื้อหา (content) ต้องเต็มความกว้างเสมอ** — หน้าเพจใช้ `w-full` และไม่ครอบด้วย `max-w-*` ที่จำกัดความกว้างของคอนเทนต์หลัก ส่วน `<main>` ใน `components/layout/app-shell.tsx` เป็น `flex-1` อยู่แล้ว
