// ตัวช่วย (proxy) เล็กๆ สำหรับดึงใบสรุปออเดอร์จาก Google Apps Script มาส่งต่อให้แอป Star PassPRNT
//
// เหตุผลที่ต้องมีไฟล์นี้: แอป Star PassPRNT (บนไอแพด) พยายามโหลดลิงก์ใบเสร็จโดยตรงจาก Apps Script
// (https://script.google.com/macros/.../exec) แต่โหลดไม่สำเร็จ ขึ้น Error E016 "Failed to download print data"
// เพราะ Apps Script ตอบกลับด้วยการ "เปลี่ยนเส้นทาง (redirect)" ไปอีกลิงก์หนึ่งเสมอ ซึ่งตัวดาวน์โหลดของ PassPRNT
// ตามลิงก์ที่เปลี่ยนเส้นทางไปไม่สำเร็จ (ต่างจากเบราว์เซอร์ทั่วไปที่ตามลิงก์แบบนี้ได้เอง)
//
// ไฟล์นี้ทำงานอยู่บน Netlify (เซิร์ฟเวอร์จริง ไม่ใช่ในเบราว์เซอร์ของลูกค้า) ซึ่งสามารถเรียกไปที่ Apps Script
// แล้วตามลิงก์ที่ถูกเปลี่ยนเส้นทางได้ตามปกติ จากนั้นส่งเนื้อหาใบเสร็จ (HTML) กลับมาให้ PassPRNT โดยตรง
// ไม่มีการเปลี่ยนเส้นทางอีกต่อหนึ่ง — แก้ปัญหา Error E016 ได้

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzmI1E3GDjhHXV1hdHnWbKdn7gjBXQf9pTqdpy0uWB74dO9JF49ciXKE0FsaMocZc__/exec';

exports.handler = async function (event) {
  const key = (event.queryStringParameters && event.queryStringParameters.key) || '';

  if (!key) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;padding:20px;">ไม่พบรหัสออเดอร์ (key) ที่ต้องการพิมพ์ค่ะ</body></html>',
    };
  }

  const targetUrl = APPS_SCRIPT_URL + '?action=printReceipt&key=' + encodeURIComponent(key);

  try {
    const res = await fetch(targetUrl, { redirect: 'follow' });
    const html = await res.text();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      body: html,
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;padding:20px;">ดึงข้อมูลใบเสร็จไม่สำเร็จ: ' +
        String((err && err.message) || err) + '</body></html>',
    };
  }
};
