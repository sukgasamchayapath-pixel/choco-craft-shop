// ⚠️ นำ Web App URL ที่ได้จากการ Deploy Google Apps Script มาวางแทนที่ตรงนี้
const SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

const PRODUCTS = {
  dk70: { sku: "CHOCO-DK70", name: "70% Dark Chocolate", price: 180 },
  mkhz: { sku: "CHOCO-MKHZ", name: "Milk Chocolate Hazelnut", price: 195 }
};

function calculateTotal() {
  const q1 = parseInt(document.getElementById("qty-dk70")?.value || 0);
  const q2 = parseInt(document.getElementById("qty-mkhz")?.value || 0);

  const total = (q1 * PRODUCTS.dk70.price) + (q2 * PRODUCTS.mkhz.price);
  let summary = [];
  if (q1 > 0) summary.push(`[${PRODUCTS.dk70.sku}] ${PRODUCTS.dk70.name} x ${q1}`);
  if (q2 > 0) summary.push(`[${PRODUCTS.mkhz.sku}] ${PRODUCTS.mkhz.name} x ${q2}`);

  const summaryEl = document.getElementById("order-summary-text");
  const totalEl = document.getElementById("total-price");
  if (summaryEl) summaryEl.innerText = summary.length > 0 ? summary.join(" , ") : "ยังไม่ได้เลือกสินค้า";
  if (totalEl) totalEl.innerText = total;
  return { total, itemsText: summary.join(" | ") };
}

const orderForm = document.getElementById("orderForm");
if (orderForm) {
  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { total, itemsText } = calculateTotal();
    if (total === 0) return alert("กรุณาเลือกสินค้าอย่างน้อย 1 แท่ง");

    const submitBtn = document.getElementById("submitBtn");
    const statusMsg = document.getElementById("statusMessage");
    submitBtn.disabled = true;
    submitBtn.innerText = "กำลังบันทึกคำสั่งซื้อลง Google Sheet...";

    const payload = {
      customerName: document.getElementById("customerName").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      items: itemsText,
      totalPrice: total
    };

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        statusMsg.style.color = "green";
        statusMsg.innerText = `✅ สั่งซื้อสำเร็จ! รหัสคำสั่งซื้อของคุณคือ ${result.orderId}`;
        orderForm.reset();
        calculateTotal();
      }
    } catch (err) {
      statusMsg.style.color = "red";
      statusMsg.innerText = "❌ เกิดข้อผิดพลาด กรุณาตรวจสอบ SCRIPT_URL ในไฟล์ app.js";
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "ยืนยันการสั่งซื้อ";
    }
  });
}

// ================= ระบบหยิบสินค้า แพ็คสินค้า และจ่าหน้าพัสดุ =================

let allOrders = [];

async function loadOrders() {
  const listEl = document.getElementById("ordersList");
  const loadingEl = document.getElementById("loading");
  if (!listEl) return;

  loadingEl.style.display = "block";
  listEl.innerHTML = "";

  try {
    const res = await fetch(SCRIPT_URL);
    allOrders = await res.json();
    loadingEl.style.display = "none";
    renderOrders();
  } catch (err) {
    loadingEl.innerText = "❌ โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ SCRIPT_URL ในไฟล์ app.js";
  }
}

function renderOrders() {
  const listEl = document.getElementById("ordersList");
  const filter = document.getElementById("statusFilter")?.value || "ALL";
  listEl.innerHTML = "";

  const filtered = allOrders.filter(o => filter === "ALL" || o.Status === filter);

  if (filtered.length === 0) {
    listEl.innerHTML = "<p>ไม่พบรายการคำสั่งซื้อในหมวดหมู่นี้</p>";
    return;
  }

  filtered.forEach((order) => {
    const originalIndex = allOrders.findIndex(o => o.OrderID === order.OrderID);
    let badgeClass = "";
    if (order.Status === "กำลังหยิบสินค้า") badgeClass = "picking";
    if (order.Status === "แพ็คเสร็จแล้ว") badgeClass = "packed";

    // แยกรายการสินค้าเป็นข้อๆ พร้อม Checkbox สำหรับพนักงานหยิบสินค้า (Pick List)
    const itemLines = String(order.Items || "").split("|").map(item => `
      <label class="pick-item">
        <input type="checkbox"> <span>${item.trim()}</span>
      </label>
    `).join("");

    const card = document.createElement("div");
    card.className = "order-card";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>${order.OrderID}</strong>
        <span class="status-badge ${badgeClass}">${order.Status}</span>
      </div>
      <small style="color:#666;">สั่งเมื่อ: ${order.Timestamp}</small>

      <div class="pick-list">
        <strong>📋 ใบรายการหยิบสินค้า (ติ๊กเพื่อตรวจสอบความถูกต้อง):</strong>
        ${itemLines}
      </div>

      <p style="font-size:0.95rem; line-height:1.5;">
        <strong>ผู้รับ:</strong> ${order.CustomerName} (${order.Phone})<br>
        <strong>ที่อยู่:</strong> ${order.Address}<br>
        <strong>ยอดชำระ:</strong> ${order.TotalPrice} บาท<br>
        <strong>เลขพัสดุ:</strong> ${order.TrackingNo || "-"}
      </p>

      <div class="admin-actions">
        <button onclick="updateOrderStatus('${order.OrderID}', 'กำลังหยิบสินค้า')" class="btn-pick">
          🛒 กำลังหยิบสินค้า
        </button>
        <button onclick="packOrder('${order.OrderID}')" class="btn-primary">
          📦 แพ็คเสร็จสิ้น
        </button>
        <button onclick="printLabel(${originalIndex})" class="btn-secondary">
          🖨️ พิมพ์ใบจ่าหน้าพัสดุ
        </button>
      </div>
    `;
    listEl.appendChild(card);
  });
}

async function updateOrderStatus(orderId, status, trackingNo = "") {
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "updateStatus",
        orderId: orderId,
        status: status,
        trackingNo: trackingNo
      })
    });
    loadOrders();
  } catch (err) {
    alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
  }
}

function packOrder(orderId) {
  const defaultTrack = "TH" + Math.floor(100000000 + Math.random() * 900000000);
  const trackingNo = prompt("กรอกเลขพัสดุ (Tracking Number) เพื่อบันทึกและพิมพ์ใบจ่าหน้า:", defaultTrack);
  if (trackingNo === null) return;
  updateOrderStatus(orderId, "แพ็คเสร็จแล้ว", trackingNo);
}

function printLabel(index) {
  const order = allOrders[index];
  const printArea = document.getElementById("printArea");

  printArea.innerHTML = `
    <div class="shipping-label">
      <div class="label-header">
        <div>
          <strong>ผู้ส่ง (SENDER):</strong><br>
          CHOCO CRAFT THAILAND<br>
          99/9 ถนนสุขุมวิท เขตวัฒนา กทม. 10110<br>
          โทร: 02-999-9999
        </div>
        <div style="text-align:right;">
          <strong>ORDER ID</strong><br>
          <span style="font-size:1.25rem; font-weight:bold;">${order.OrderID}</span><br>
          <span>Tracking: <strong>${order.TrackingNo || 'รอออกเลขพัสดุ'}</strong></span>
        </div>
      </div>

      <div class="label-receiver">
        <strong>ผู้รับ (RECEIVER):</strong><br>
        <span style="font-size:1.3rem; font-weight:bold;">${order.CustomerName}</span><br>
        <strong>โทร:</strong> ${order.Phone}<br>
        <strong>ที่อยู่จัดส่ง:</strong> ${order.Address}
      </div>

      <div class="label-box">
        <strong>รายการสินค้าภายในกล่อง (Packing List):</strong><br>
        ${String(order.Items || "").replace(/\|/g, "<br>")}<br><br>
        <small>*คำเตือน: สินค้าช็อกโกแลต กรุณาเก็บในที่เย็น หลีกเลี่ยงแสงแดดและความร้อน*</small>
      </div>
    </div>
  `;

  window.print();
}
