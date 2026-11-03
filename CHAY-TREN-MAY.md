# Chạy PowerLab trên máy cá nhân

## Chuẩn bị

- Cài Node.js 24 LTS (kèm npm), hoặc Node.js >= 22.12.
- Cài **Python 3.12** (kèm pip). Trên Windows, chọn **Add Python to PATH** khi cài.
- Cần Internet cho lần cài dependencies đầu tiên.
- Giải nén ZIP vào thư mục bạn có quyền ghi. Không cần Docker, uv hoặc PostgreSQL cho bản demo này.

## Chạy ứng dụng

Mở Terminal hoặc PowerShell tại thư mục `mophongscada` có `package.json` ở ngoài cùng:

```bash
npm run setup
npm run dev
```

Lệnh setup tạo `.venv`, cài backend Python theo lockfile và cài frontend bằng `npm ci`. Lệnh dev khởi động cả hai dịch vụ, không chỉ giao diện.

Mở **http://localhost:5173** bằng trình duyệt. Chờ trạng thái **Telemetry trực tuyến** rồi chọn bài thực hành. Để dừng, nhấn **Ctrl+C** trong Terminal. Những lần sau chỉ cần `npm run dev`; chạy lại setup khi dependencies thay đổi.

## Bài tập thử nhanh

1. Chọn **Sự cố lộ LT1**, nhấn **Phiên mới**.
2. Nhấn lộ LT1 trên sơ đồ. Thử đóng máy cắt khi còn sự cố để thấy liên động từ chối.
3. Hủy xác nhận; chọn **Xác nhận đã kiểm tra và xử lý sự cố**.
4. Đóng lại máy cắt và xác nhận. Kiểm tra kết quả hoàn thành, nhật ký và báo cáo.

## Nếu không chạy được

- `npm` không được nhận diện: cài Node.js rồi mở Terminal mới.
- Thiếu Python: kiểm tra `py -3.12 --version` trên Windows hoặc `python3.12 --version` trên macOS/Linux. Ubuntu có thể cần gói `python3.12-venv`.
- Cổng 8000/5173 đang được dùng: dừng bản PowerLab cũ hoặc chương trình đang dùng cổng rồi chạy lại. Không chạy đồng thời `scripts/dev.sh` và `npm run dev`.
- Mất phiên sau khi restart backend: chọn **Phiên mới**. Nhật ký được lưu tại `backend/data/training.db`, trạng thái phiên chỉ giữ trong RAM.
- Có giao diện nhưng không kết nối telemetry: xem lỗi backend ngay trong Terminal; kiểm tra http://localhost:8000/api/health.

## Phạm vi

Đây là mô hình đào tạo mẫu, không kết nối thiết bị điện thực. Backend Python vẫn cần thiết cho tính toán pandapower; chỉ cài npm không đủ để chạy mô phỏng. Chưa có đăng nhập/phân quyền hoặc phòng học nhiều người. Không mở ứng dụng ra Internet công cộng.

Gói ZIP chỉ chứa mã nguồn, tài liệu và lockfile; không chứa môi trường Python, node_modules, cache, nhật ký diễn tập, dữ liệu phiên, .env hoặc Git metadata.

Đã kiểm tra launcher trên Linux. Nhánh Windows/macOS được viết theo đường dẫn và lệnh tương ứng nhưng chưa được chạy trên hai hệ điều hành đó.
