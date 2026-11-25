# 🍫 CHOCO CRAFT - Landing Page & Fulfillment System

โปรเจกต์เว็บไซต์ขายช็อกโกแลตแท่ง (2 SKUs) เชื่อมต่อฐานข้อมูลด้วย Google Sheets และมีระบบหลังบ้านสำหรับหยิบสินค้า แพ็คสินค้า และพิมพ์ใบจ่าหน้าพัสดุ

## 📁 โครงสร้างโฟลเดอร์ (Repository Structure)
```text
├── index.html          # หน้า Landing Page สำหรับลูกค้าสั่งซื้อ
├── admin.html          # หน้าจัดการคลังสินค้า (Pick, Pack & Print Shipping Label)
├── style.css           # ไฟล์ตกแต่ง UI และรูปแบบใบจ่าหน้าพัสดุสำหรับพิมพ์
├── app.js              # ระบบเชื่อมต่อ Google Sheets API และคำนวณตะกร้าสินค้า
└── images/             # โฟลเดอร์เก็บรูปภาพแยกต่างหาก
    ├── choco-dark.jpg  # รูปสินค้า SKU: CHOCO-DK70
    ├── choco-milk.jpg  # รูปสินค้า SKU: CHOCO-MKHZ
    └── hero-banner.jpg # รูปแบนเนอร์หน้าแรก
```

## 🚀 ขั้นตอนการติดตั้งและใช้งาน
1. Import ไฟล์ `Chocolate_Orders_DB.xlsx` เข้าสู่ Google Sheets
2. เปิดเมนู **ส่วนขยาย (Extensions) > Apps Script** วางโค้ด Backend และกด **Deploy เป็น Web App** (ตั้งสิทธิ์เป็น **Anyone**)
3. นำ Web App URL มาใส่ในตัวแปร `SCRIPT_URL` ในไฟล์ `app.js`
4. อัปโหลดไฟล์ทั้งหมดขึ้น GitHub Repository (พร้อมใส่รูปภาพในโฟลเดอร์ `images/`)
5. เชื่อมต่อ Repository กับ **Vercel** เพื่อเผยแพร่เว็บไซต์
