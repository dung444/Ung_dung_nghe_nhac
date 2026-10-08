# Payment Security Retrospective

## 2026-10-08 — Chặn tự xác nhận thanh toán

- Nguyên nhân gốc rễ: các endpoint cũ và `POST /payments/orders/:orderId/confirm` cho phép client đánh dấu thanh toán thành công trước khi có xác minh giao dịch ngân hàng.
- Biện pháp: vô hiệu hóa các endpoint cũ bằng HTTP 410; mọi thanh toán phải đi qua tạo đơn, nộp biên lai và admin duyệt. Đơn hết hạn bị từ chối khi nộp biên lai hoặc duyệt.
- Regression tests: xác nhận khách không thể tự xác nhận, các endpoint cũ bị từ chối, và đơn hết hạn không thể nộp/duyệt.
- Phòng ngừa: không để client quyết định trạng thái `SUCCESS`; chỉ admin hoặc webhook đối soát ngân hàng đáng tin cậy được phép cấp xu/VIP. Các chuyển trạng thái phải kiểm tra hạn đơn.
- Cô lập test: trạng thái thanh toán khi chạy Vitest được ghi vào `payment_data.test.<pid>.json`, không còn ghi đè `payment_data.json` của môi trường phát triển.
