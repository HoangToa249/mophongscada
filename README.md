# PowerLab — Mô phỏng và đào tạo vận hành điện

Bản nền tảng v0.1: React + TypeScript + React Flow + Tailwind, FastAPI, pandapower và SQLAlchemy. Giao diện tiếng Việt. Không kết nối thiết bị thực.

## Tải về và chạy trên máy cá nhân

Xem [CHAY-TREN-MAY.md](CHAY-TREN-MAY.md). Cài Node.js 24 và Python 3.12, mở Terminal trong thư mục gốc dự án, chạy `npm run setup`, sau đó `npm run dev`. Lệnh này khởi động đồng thời API mô phỏng và giao diện. Mở http://localhost:5173. Dùng Ctrl+C để dừng cả hai dịch vụ.

## Chạy phát triển

Yêu cầu: Python 3.12, uv, Node.js 22.12+ (đã kiểm tra Node 24), npm.

```bash
cd /workspace/mophongscada
bash scripts/install.sh
bash scripts/dev.sh
```

Frontend cổng 5173; API cổng 8000. Vite chuyển tiếp `/api` và `/ws` về backend trên cùng origin. Dừng script bằng Ctrl+C để dừng cả hai tiến trình. Nếu cổng đã được dùng, kiểm tra tiến trình trước khi chạy lại. Log ở `.run/backend.log` và `.run/frontend.log`. Kiểm tra API bằng `curl --fail http://127.0.0.1:8000/api/health`.

```bash
cd backend
../.venv/bin/python -m pytest -q
cd ../frontend
npm run build
```

Kiểm thử trình duyệt (tùy chọn): môi trường này có sẵn Playwright Python 1.62 và Chromium `/usr/bin/chromium`; khi hai server đang chạy, dùng `python3 scripts/smoke_browser.py`. Script kiểm tra liên động, khôi phục, báo cáo, điều chỉnh tải, tải lại phiên và bố cục mobile. Nếu chạy ở máy khác cần cài Playwright/Chromium riêng. CI trong `.github/workflows/check.yml` chạy backend tests và frontend build; chưa chạy CI trên GitHub.

Trong môi trường Codex, các lệnh dùng socket (server, TestClient, trình duyệt) có thể cần quyền chạy ngoài sandbox mặc định. Không tắt TLS hay thay đổi proxy để khắc phục.

## Luồng thực hành

1. Chọn vận hành tự do, sự cố LT1 hoặc quá tải MBA rồi tạo phiên mới.
2. Theo dõi điện áp p.u., công suất MW/MVAr, dòng kA và phần trăm mang tải mỗi 2 giây.
3. Nhấn lộ trên sơ đồ, chọn đóng/cắt, xác nhận thao tác. Máy chủ kiểm tra phiên bản trạng thái để tránh lệnh dựa trên dữ liệu cũ.
4. Sự cố LT1 làm bảo vệ cắt máy cắt. Xác nhận đã kiểm tra/xử lý sự cố rồi đóng lại; đóng khi còn sự cố bị từ chối và ghi nhận lỗi.
5. Điều chỉnh hệ số phụ tải để xử lý quá tải. Hoàn thành khi mọi lộ có điện và thông số trong giới hạn.
6. Xuất báo cáo JSON gồm nhật ký, thao tác, lỗi và thời gian hoàn thành. Điểm minh họa = 100 trừ 10 cho mỗi lệnh sai, tối thiểu 0.

## Mô hình và giới hạn hiện tại

- Lưới mẫu cân bằng 22/0.4 kV, MBA 4 MVA, ba lộ LT1/LT2/UC. Đây là mô hình khởi tạo, chưa khớp thiết kế điện thực tế hoặc toàn bộ thiết bị trong các sơ đồ gốc.
- `pandapower.runpp()` Newton–Raphson tính trào lưu trạng thái xác lập. Cắt lộ làm cô lập phụ tải; dữ liệu NaN ở nút mất điện được chuyển về 0 trong JSON. Không hội tụ được báo `SYSTEM COLLAPSE`.
- Kịch bản sự cố mô phỏng bảo vệ TRIP; **chưa** tính dòng ngắn mạch, chọn lọc bảo vệ, quá độ, tần số động hoặc hòa đồng bộ máy phát.
- Phiên mô phỏng độc lập trong RAM, mất khi restart; tối đa 100 phiên trong bản demo. Nhật ký lưu bền, 500 bản ghi gần nhất được hiển thị/xuất. Không phải hệ thống phòng học đa người dùng.
- Chưa có đăng nhập, phân quyền, quản lý lớp/PIN, timeline sự kiện hay topology builder. Chỉ dùng trong môi trường phát triển tin cậy; không đưa API này lên Internet công cộng trước khi bổ sung xác thực và quyền truy cập.
- SQLite là mặc định (`backend/data/training.db`). Có thể dùng PostgreSQL qua `DATABASE_URL=postgresql+psycopg://...` được đặt trong môi trường chạy; không đưa mật khẩu vào Git. Driver đã cài, nhưng PostgreSQL chưa được kiểm thử trong phiên khởi tạo.
- Build frontend đã sẵn sàng để đóng gói. `vite preview` chỉ phục vụ static; triển khai production cần reverse proxy cho `/api` và `/ws`, TLS và xác thực. Không dùng dev server làm production.

## Tài liệu

- [Phân tích tài liệu và lộ trình](docs/ANALYSIS.md).
- [Nguồn tham chiếu của người dùng](docs/reference/): giữ nguyên 12 tệp TSX và bản kế hoạch, chưa được import vào frontend đang chạy vì thiếu dependencies nội bộ và mô hình dữ liệu.
- `backend/app/engine.py`: lõi tính toán độc lập API.
- `backend/app/main.py`: REST, WebSocket và quản lý phiên.
- `backend/app/storage.py`: nhật ký SQLAlchemy.

Mã nguồn được quản lý tại repository `HoangToa249/mophongscada`. Có thể tải bằng **Code → Download ZIP**, hoặc clone repository rồi làm theo `CHAY-TREN-MAY.md`.
