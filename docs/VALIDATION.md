# Kiểm chứng bản khởi tạo — 2026-11-03

- Python 3.12.14, Node 24.22.1, pandapower 3.5.6.
- `bash scripts/install.sh`: thành công, đã chạy lại với Python lock và `npm ci`; frontend build thành công.
- Backend: 7 tests passed. Một cảnh báo deprecation của Starlette TestClient/httpx; không có test bị bỏ qua.
- Chromium/Playwright: kiểm tra từ giao diện qua Vite proxy tới FastAPI và pandapower. Liên động đóng lộ còn sự cố bị từ chối; xác nhận xử lý rồi đóng phục hồi; báo cáo ghi 1 lỗi, 90 điểm và thời gian hoàn thành. Phiên được tải lại trong cùng vòng đời máy chủ. Kịch bản quá tải được khôi phục bằng giảm hệ số tải. Điều hướng và màn hình mobile 390 px không tràn ngang; không có page errors.
- Ảnh kiểm tra cục bộ: `.run/desktop.png`, `.run/mobile.png` (được ignore).
- Đã dừng và khởi động lại bằng `scripts/dev.sh`. Health trên cổng API 8000 và qua Vite 5173 đều OK; POST phiên mới qua Vite trả ba lộ có điện, trạng thái normal, P nguồn khoảng 2.863 MW.
- 13 tệp đầu vào được giữ nguyên byte trong `docs/reference`.

Các kiểm tra socket/trình duyệt được thực thi bằng quyền chạy mạng được môi trường cấp; sandbox mặc định chặn socket nội bộ. Không thay đổi proxy hoặc tắt kiểm tra TLS.

Tại thời điểm kiểm chứng ban đầu, chưa kiểm chứng PostgreSQL thực, CI trên GitHub, triển khai production, snapshot sau Publish hoặc khôi phục trong task mới. `install_script` và `start_skill` đã được lưu vào bản nháp cấu hình môi trường; lưu nháp không có nghĩa là đã Publish.
