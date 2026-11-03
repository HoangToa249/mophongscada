# Phân tích đầu vào và phương án khởi tạo

## Những gì đã nhận

12 tệp React TSX gồm tổng trạm (`ElectricSystem`, `ElectricScadaDiagram`, `ElectricConfigModal`), LT1/LT2/tự dùng (mỗi khu có System, CabinetView, RoomScadaDiagram). Tệp `Kế hoạc xây dựng app.md` mô tả mục tiêu SCADA/EMS đào tạo và kiến trúc React/FastAPI/pandapower/PostgreSQL.

Các TSX dùng sơ đồ SVG tùy biến, cấu hình tag PLC/Kepware, `plcService`, `socketService`, kiểu `ElectricState`, component `GeneratorInfoModal` và `utils/generatorConfig`. Những phụ thuộc nội bộ đó không có trong tập tin đính kèm. Trạng thái đóng/cắt có thể dùng giá trị mặc định nếu chưa cấu hình tag, không chứng minh có tính toán vật lý. Một số kiểu mode máy phát trong `ElectricSystem` cũng chưa nhất quán với các giá trị gán. Vì vậy không thể chỉ chép các tệp vào Vite rồi coi là ứng dụng mô phỏng đã hoàn chỉnh.

Giữ nguyên đầu vào trong `docs/reference` để bảo toàn ký hiệu thiết bị (471, 412, 443, 437, 431, C41/C42, T1… và D1–D4). Bản chạy mới sử dụng React Flow với ba lộ đại diện; chưa tuyên bố tái hiện hoàn chỉnh tổng trạm gốc. Cách tách này tránh giả định API PLC hoặc tạo telemetry giả cho thiết bị chưa có mô hình.

## Phạm vi v0.1 đã triển khai

1. Lõi pandapower độc lập FastAPI; trào lưu, cô lập lộ, mất điện, cảnh báo điện áp/mang tải, xử lý không hội tụ.
2. FastAPI tạo phiên, nhận lệnh có kiểm tra revision, liên động sự cố, WebSocket cập nhật 2 giây.
3. SQLAlchemy lưu nhật ký, SQLite cho môi trường khởi tạo; hỗ trợ chuỗi kết nối PostgreSQL. Chưa triển khai user/auth.
4. React Flow hiển thị telemetry thực từ mô phỏng, trạng thái có điện/sự cố/mất điện; popup xác nhận lệnh, dashboard và nhật ký tiếng Việt.
5. Ba kịch bản cố định, đánh giá minh họa và xuất JSON. Chưa có giảng viên/học viên với quyền tách biệt.

## Các bước tiếp theo

- Xác minh sơ đồ thực, điện áp danh định C41/C42, công suất và tham số MBA, thông số cáp, cấu hình tiếp địa, thông số máy phát và logic liên động. Cần dữ liệu kỹ thuật để chuyển từ lưới mẫu sang mô hình cơ sở.
- Tạo schema topology có ID thiết bị ổn định; adapter ánh xạ kết quả pandapower sang `ElectricState` để tái sử dụng các sơ đồ LT1/LT2/UC. Khôi phục dependencies nội bộ theo API mô phỏng, giữ tách biệt hoàn toàn kết nối PLC thực.
- Thêm PostgreSQL được quản lý, migration Alembic, User/GridModel/Scenario/Session/SessionLog, JWT và kiểm tra quyền trên mọi REST/WebSocket. Không coi selector giao diện là phân quyền.
- Lưu/khôi phục trạng thái phiên; worker riêng, quản lý tuổi thọ phiên và giới hạn tài nguyên; mở phòng học với PIN.
- Scenario builder có timeline, tiêu chí chấm theo quy trình được chuyên gia phê duyệt, thời gian mất điện và giới hạn vi phạm; báo cáo đầy đủ có phân trang.
- Tính ngắn mạch IEC 60909 và phối hợp bảo vệ theo yêu cầu; trào lưu tĩnh không đủ để mô phỏng quá trình quá độ hoặc đồng bộ nguồn.

## Quyết định kỹ thuật

Mô hình mẫu ưu tiên chứng minh đầu-cuối và liên động thay vì suy diễn thông số thiết bị thật. Không cần tài khoản hoặc secret cho luồng khởi tạo. Chỉ triển khai trong môi trường tin cậy. Nhật ký bền vững và phiên RAM là hai loại dữ liệu khác nhau; restart không khôi phục phiên cũ. Phần chấm điểm là minh họa, không dùng để chứng nhận năng lực vận hành.
