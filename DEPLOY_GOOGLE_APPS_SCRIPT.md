# 🚀 วิธีนำ PDF Pro ขึ้นใช้งานบน Google Apps Script (Web App)

เนื่องจากระบบ **PDF Pro** ออกแบบด้วยสถาปัตยกรรม **Client-Side First (100% Zero-Upload)** ประมวลผลบนเบราว์เซอร์ทั้งหมด จึง**สามารถนำขึ้นเป็น Web App บน Google Apps Script ได้ 100% โดยไม่มีค่าใช้จ่ายเซิร์ฟเวอร์ (ฟรีตลอดชีพ)**

---

## 📦 ขั้นตอนการเตรียมไฟล์ (Build Single File)

ผมได้เซ็ตอัปคำสั่งอัตโนมัติไว้ให้เรียบร้อยแล้ว:

```bash
npm run build:gas
```

เมื่อรันเสร็จ คุณจะได้ไฟล์ HTML รวมสมบูรณ์พร้อมใช้ที่:
📁 `dist-gas/index.html` (รวม React + Tailwind CSS + Lucide Icons + PDF Engines ไว้ในไฟล์เดียว)

---

## 🌐 ขั้นตอนการเอาขึ้น Google Apps Script (2 นาที)

1. เปิดเว็บไซต์ [Google Apps Script](https://script.google.com/) แล้วกด **"New project" (โครงการใหม่)**
2. ในไฟล์ `Code.gs` ให้ลบโค้ดเดิมแล้ววางโค้ดนี้ลงไป:
   ```javascript
   function doGet(e) {
     return HtmlService.createHtmlOutputFromFile('index')
       .setTitle('PDF Pro - ระบบจัดการไฟล์ PDF ครบวงจร')
       .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
       .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
   }
   ```
3. กดปุ่ม **+ (เพิ่มไฟล์)** ด้านซ้าย ➔ เลือก **"HTML"** ➔ ตั้งชื่อไฟล์ว่า `index` (จะได้ `index.html`)
4. เปิดไฟล์ `dist-gas/index.html` ในโฟลเดอร์โปรเจกต์ของคุณ ➔ **คัดลอก (Copy) โค้ดทั้งหมด** ➔ นำไปวาง (Paste) ทับลงในไฟล์ `index.html` บน Google Apps Script
5. กดปุ่ม **Deploy (การทำให้ใช้งานได้)** มุมบนขวา ➔ เลือก **New deployment (การทำให้ใช้งานได้รายการใหม่)**
6. กดรูปเฟือง ⚙️ ➔ เลือกประเภทเป็น **Web app (เว็บแอป)**
7. ตั้งค่า:
   - **Description**: `PDF Pro v1.0`
   - **Execute as (ดำเนินการในฐานะ)**: `Me (ฉัน)`
   - **Who has access (ผู้มีสิทธิ์เข้าถึง)**: `Anyone (ทุกคน)`
8. กด **Deploy** ➔ คุณจะได้รับลิงก์ Web App URL (เช่น `https://script.google.com/macros/s/.../exec`) สามารถเปิดใช้งานหรือแชร์ให้ทีมงานใช้งานได้ทันทีครับ!
