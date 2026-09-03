# 📄 PDF PRO BY Oatdh

> **100% Client-Side Pure Browser PDF Suite • Zero Server Upload Privacy**  
> เว็บแอปพลิเคชันจัดการและแก้ไขไฟล์ PDF ครบวงจร ทำงานบนเบราว์เซอร์ 100% ปลอดภัย ไม่ส่งไฟล์ขึ้นเซิร์ฟเวอร์

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ จุดเด่นและคุณสมบัติ (Key Features)

### 📂 1. จัดการหน้าและเอกสาร (Organize PDF)
- **รวมไฟล์ PDF (Merge PDF)**: รวมหลายไฟล์เข้าด้วยกัน พร้อมลากจัดลำดับหน้าและไฟล์ได้อย่างอิสระ
- **แยกไฟล์ PDF (Split PDF)**: แยกตามช่วงหน้าที่ต้องการ หรือแยกทุกหน้าออกเป็นไฟล์เดี่ยวแบบแพ็กเกจ ZIP
- **จัดเรียงและลบหน้า (Organize & Reorder)**: แสดงตัวอย่างหน้าเอกสารทั้งหมด หมุนหน้า หรือลบหน้าที่ไม่ต้องการ
- **หมุนหน้า PDF (Rotate PDF)**: หมุนเอกสาร 90°, 180°, 270° ทั้งหมดหรือเฉพาะหน้าที่เลือก
- **ดึงหน้าที่เลือก (Extract Pages)**: เลือกเฉพาะหน้าที่ต้องการเพื่อสร้างเอกสารใหม่

### 🔄 2. แปลงและปรับแต่งไฟล์ (Convert & Optimize)
- **แปลงรูปภาพเป็น PDF (Images to PDF)**: แปลง JPG, PNG, WebP เป็น PDF กำหนดขนาดกระดาษและระยะขอบได้
- **แปลง PDF เป็นรูปภาพ (PDF to Images)**: เรนเดอร์หน้า PDF คุณภาพสูงเป็น JPG/PNG พร้อมดาวน์โหลดทั้งแบบรูปเดี่ยวและ ZIP
- **บีบอัดไฟล์ PDF (Compress PDF)**: ลดขนาดไฟล์ด้วยการปรับ Resample รูปภาพแบบเลือกระดับได้
- **สแกนข้อความ OCR (OCR & Text Extraction)**: ถอดข้อความภาษาไทยและอังกฤษจากภาพ/PDF โดยตรงในเบราว์เซอร์

### ✏️ 3. แก้ไขและเขียนทับ (Edit & Annotate)
- **แก้ไข PDF (PDF Editor)**: วาดเขียนปากกา, ไฮไลต์, วางกล่องข้อความ และแทรกรูปภาพ/สแตมป์
- **ใส่ลายน้ำ (Watermark)**: ใส่ข้อความหรือโลโก้ลายน้ำ ปรับความโปร่งใส มุมเอียง และตำแหน่ง 9 ทิศทาง
- **ใส่เลขหน้า (Page Numbers)**: ใส่เลขหน้าแบบอัตโนมัติ พร้อมรูปแบบภาษาไทยและสากล เช่น `หน้า 1 จาก 10`, `1 / 10`

### 🔒 4. ความปลอดภัยและความเป็นส่วนตัว (Security & Privacy)
- **เซ็นเอกสาร PDF (Sign PDF)**: วาดลายเซ็น, พิมพ์ชื่อ, หรืออัปโหลดรูปลายเซ็น พร้อมลากขยับและย่อขยายขนาดได้อย่างอิสระ
- **ล็อกรหัสผ่าน PDF (Protect PDF)**: เข้ารหัสไฟล์มาตรฐาน AES-256 Bit Encryption
- **ปลดล็อกรหัสผ่าน PDF (Unlock PDF)**: ถอดรหัสและลบการป้องกันรหัสผ่านของไฟล์ PDF ได้อย่างสมบูรณ์
- **เซนเซอร์ถมดำ (Redact PDF)**: ปิดบังข้อมูลสำคัญหรือข้อมูลลับแบบถาวร (300 DPI Flattening)
- **แก้ไขข้อมูลเอกสาร (Metadata Editor)**: ดูและแก้ไขข้อมูล Title, Author, Keywords หรือล้างประวัติไฟล์ทั้งหมด

---

## 🔒 ความเป็นส่วนตัวสูงสุด (100% Zero Server Upload)

แอปพลิเคชันนี้ประมวลผลไฟล์ทั้งหมดผ่าน **WebAssembly, Canvas API, pdf-lib, PDF.js และ Tesseract.js** ภายในเบราว์เซอร์ของคุณโดยตรง **ไม่มีการส่งไฟล์ PDF หรือข้อมูลส่วนตัวใดๆ ไปยังเซิร์ฟเวอร์ภายนอก** ทำให้ปลอดภัยต่อเอกสารสัญญา ข้อมูลทางการเงิน และเอกสารสำคัญ

---

## 🚀 การติดตั้งและเปิดใช้งานในเครื่อง (Getting Started)

### ข้อกำหนดเบื้องต้น
- [Node.js](https://nodejs.org/) (เวอร์ชัน 18 ขึ้นไป)
- [Git](https://git-scm.com/)

### 1. โคลนคลังโค้ด (Clone Repository)
```bash
git clone https://github.com/susuoate/pdf-pro.git
cd pdf-pro
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. เปิดใช้งาน Dev Server
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:5173/`

### 4. บิลด์สำหรับ Production
```bash
npm run build
```

---

## 🌐 การนำขึ้นออนไลน์บน Google Apps Script (Standalone HTML)

โปรเจกต์นี้รองรับการบิลด์เป็น **Single-File HTML (`dist-gas/index.html`)** เพื่อนำไปโฮสต์ใช้งานบน Google Apps Script ได้ฟรี 100%:

```bash
npm run build:gas
```

นำโค้ดใน `dist-gas/index.html` และ `dist-gas/Code.gs` ไปสร้างเป็น Web App บน Google Apps Script ดูคำแนะนำแบบละเอียดได้ที่ [README_GAS.md](README_GAS.md)

---

## 👤 ผู้จัดทำ (Author)

- **ผู้จัดทำ**: **IG : [Oatdh](https://instagram.com/oatdh)**
- **ขับเคลื่อนโดย**: **Powered by Antigravity**

---

## 📄 ใบอนุญาต (License)

โปรเจกต์นี้เผยแพร่ภายใต้ใบอนุญาต **MIT License**