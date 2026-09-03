# วิธีการนำ PDF PRO BY Oatdh ขึ้นออนไลน์บน Google Apps Script (GAS)

ไฟล์สำหรับ Google Apps Script ทั้งหมดจะถูกบิลด์รวมเป็นไฟล์ HTML ไฟล์เดียวแบบ Standalone อยู่ในโฟลเดอร์:
📂 `c:\Users\oate_\Desktop\pdf pro\dist-gas\`

---

## 🚀 วิธีที่ 1: ทำผ่านหน้าเว็บ Google Apps Script (แนะนำ - ง่ายที่สุดใน 2 นาที)

### ขั้นตอนที่ 1: สร้างโปรเจกต์ใหม่
1. เปิดเบราว์เซอร์แล้วไปที่: [https://script.google.com/](https://script.google.com/)
2. คลิกปุ่ม **"+ โครงการใหม่" (New Project)** ที่มุมซ้ายบน
3. เปลี่ยนชื่อโครงการที่มุมบนซ้ายเป็น **"PDF PRO BY Oatdh"**

### ขั้นตอนที่ 2: วางโค้ดในไฟล์ `Code.gs`
1. ในไฟล์ `Code.gs` ให้ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดต่อไปนี้:

```javascript
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('PDF PRO BY Oatdh')
    .setFaviconUrl('https://cdn-icons-png.flaticon.com/512/337/337946.png')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

### ขั้นตอนที่ 3: สร้างไฟล์ `index.html`
1. กดที่เครื่องหมาย **`+` (เพิ่มไฟล์)** ข้างๆ เมนูไฟล์ทางซ้าย -> เลือก **"HTML"**
2. ตั้งชื่อไฟล์ว่า **`index`** (ระบบจะสร้างเป็น `index.html`)
3. เปิดไฟล์ `dist-gas/index.html` ในเครื่องของคุณ (ใช้ VS Code หรือ Notepad)
4. กด `Ctrl + A` (เลือกทั้งหมด) และ `Ctrl + C` (คัดลอก)
5. นำโค้ดทั้งหมดมาวาง (`Ctrl + V`) ทับในไฟล์ `index.html` บน Google Apps Script
6. กดปุ่มไอคอน **💾 บันทึกโครงการ (Save project)**

### ขั้นตอนที่ 4: เผยแพร่เว็บแอป (Deploy)
1. คลิกปุ่มสีน้ำเงิน **"ทำให้ใช้งานได้" (Deploy)** ที่มุมขวาบน -> เลือก **"การทำให้ใช้งานได้รายการใหม่" (New deployment)**
2. คลิกไอคอนรูปฟันเฟือง ⚙️ ด้านซ้าย -> เลือก **"เว็บแอป" (Web app)**
3. ตั้งค่าดังนี้:
   - **คำอธิบาย (Description)**: `PDF PRO BY Oatdh v1.0`
   - **เรียกใช้เป็น (Execute as)**: `ฉัน (your.email@gmail.com)`
   - **ผู้มีสิทธิ์เข้าถึง (Who has access)**: `ทุกคน (Anyone)`
4. คลิกปุ่ม **"ทำให้ใช้งานได้" (Deploy)**
5. คุณจะได้รับ **URL เว็บแอป (Web App URL)** เช่น:
   `https://script.google.com/macros/s/AKfycb.../exec`
   👉 สามารถนำ URL นี้ไปเปิดใช้งานได้ทันทีทั้งบนคอมพิวเตอร์ มือถือ และแท็บเล็ต!

---

## ⚡ วิธีสั่ง Build ใหม่เมื่อมีการแก้ไขโค้ด
หากในอนาคตต้องการอัปเดตโค้ด สามารถเปิด Terminal แล้วพิมพ์คำสั่ง:
```bash
npm run build:gas
```
ไฟล์ `dist-gas/index.html` จะถูกอัปเดตใหม่อัตโนมัติ จากนั้นเพียงก๊อปปี้ไปวางทับใน Google Apps Script แล้วกด Deploy Version ใหม่ได้เลยครับ!
