# PROJECT MASTER PLAN & REQUIREMENTS SPECIFICATION
## Project Name: Power System Simulation WebApp for Incident Response Training
## Document Purpose: Instructions and requirements for AI Development Agent

---

## 1. PROJECT OVERVIEW
Xây dựng một ứng dụng web mô phỏng hệ thống điện thời gian thực (SCADA/EMS Simulator) dành cho việc đào tạo và diễn tập xử lý sự cố. 
- **Mục tiêu:** Cung cấp môi trường an toàn để điều độ viên thực hành đóng/cắt, xử lý sự cố lưới điện dựa trên tính toán vật lý thực tế.
- **Đối tượng người dùng:**
  - `Instructor` (Giảng viên): Tạo kịch bản sự cố, quản lý lớp học, đánh giá kết quả.
  - `Trainee` (Học viên): Vận hành lưới điện, xử lý báo động, thao tác trên sơ đồ đơn tuyến (SLD).

## 2. TECHNOLOGY STACK (Yêu cầu Agent tuân thủ)
- **Frontend:** React.js (hoặc Next.js), TailwindCSS.
  - *Thư viện vẽ Sơ đồ đơn tuyến (SLD):* React Flow hoặc D3.js (ưu tiên React Flow cho dễ tương tác node-edge).
- **Backend (API & Websocket):** Python (FastAPI). Lý do: Dễ dàng tích hợp trực tiếp với các thư viện tính toán mô phỏng lõi bằng Python.
- **Simulation Engine:** `pandapower` (thư viện Python chuẩn mã nguồn mở cho tính toán trào lưu công suất và ngắn mạch).
- **Database:** PostgreSQL (lưu trữ user, topologies lưới điện, scenarios, session logs).
- **Real-time Communication:** WebSockets (FastAPI WebSockets) để đẩy dữ liệu telemetry (U, I, P, Q) từ backend lên frontend mỗi 1-2 giây.

## 3. SYSTEM ARCHITECTURE
1. **Frontend (Client):** Nhận tương tác (click máy cắt, tăng công suất), gửi command qua API/WebSocket. Nhận Telemetry Data qua WebSocket và cập nhật màu sắc/thông số trên SLD.
2. **Backend (Server):** 
   - Quản lý REST API cho CRUD (Users, Scenarios, Topologies).
   - Quản lý WebSocket sessions cho các phòng học (Rooms).
3. **Simulation Worker:** Vòng lặp chạy nền. Lấy trạng thái lưới điện hiện tại (Topology State), nạp vào `pandapower`, chạy thuật toán Newton-Raphson để giải bài toán trào lưu công suất, trả về kết quả (Điện áp, Dòng, Công suất nhánh) cho Backend để broadcast.

## 4. DETAILED FEATURES (TÍNH NĂNG CHI TIẾT)

### 4.1. Authentication & Role Management
- Đăng nhập/Đăng ký.
- Phân quyền: Admin (Quản trị hệ thống), Instructor (Tạo kịch bản), Trainee (Tham gia diễn tập).

### 4.2. Khối Quản lý Lưới điện & Kịch bản (Instructor)
- **Grid Topology Builder:** Tạo các lưới điện mẫu (hỗ trợ import file dữ liệu chuẩn định dạng json hoặc định dạng pandapower).
- **Scenario Builder (Tạo kịch bản):**
  - Giao diện dạng Timeline (Dòng thời gian).
  - Thêm các sự kiện (Events) theo thời gian: VD: phút 02:00 -> Ngắn mạch đường dây L1; phút 05:00 -> Mất máy phát G2.
- **Session Management:** Mở một "phòng" diễn tập, gán một kịch bản, và cấp mã PIN cho Trainee tham gia.

### 4.3. Khối Giao diện Vận hành SCADA (Trainee)
- **Single Line Diagram (SLD) View:**
  - Hiển thị mạng điện đồ họa (Nodes/Buses, Lines, Transformers, Generators, Loads).
  - Hiện thông số realtime bên cạnh thiết bị (VD: Bus 1: 22.1 kV, Line 1: 50MW / 10MVAr).
  - Đổi màu cảnh báo: Xanh (Bình thường), Đỏ (Quá tải/Quá áp), Xám (Mất điện).
- **Control Actions:** 
  - Click vào Máy cắt (Circuit Breaker) -> Bật popup xác nhận Đóng/Cắt (Open/Close).
  - Click vào Máy phát/Tải -> Bật popup điều chỉnh Setpoint công suất (P, Q).
- **Alarm / Event List:** Bảng bên dưới màn hình hiển thị log sự kiện (VD: `[10:05:01] CẢNH BÁO: Đường dây L1 quá tải 110%`).

### 4.4. Simulation Engine (Core)
- Xử lý cô lập điểm sự cố (Islanding).
- Tính toán điện áp các nút (Bus Voltage).
- Tính toán phần trăm mang tải của đường dây (Line Loading).
- Phát hiện mất điện diện rộng (Blackout).

### 4.5. Đánh giá & Chấm điểm (Evaluation)
- Ghi log (Audit trail) tất cả thao tác của Trainee kèm timestamp.
- Xuất báo cáo sau diễn tập: Tổng thời gian sự cố, các giới hạn bị vi phạm trong quá trình xử lý, thao tác sai.

## 5. IMPLEMENTATION PHASES (HƯỚNG DẪN TRIỂN KHAI CHO AGENT)

*Agent: Please execute this project step-by-step according to the following phases. Do not jump to frontend before core logic is proven.*

**Phase 1: Core Simulation Engine (Python & Pandapower)**
- Task: Cài đặt script Python sử dụng `pandapower`. Tạo một lưới điện mẫu tĩnh (IEEE 14-bus hoặc lưới 3 nút đơn giản).
- Task: Viết hàm đầu vào nhận lệnh cắt đường dây/máy phát, chạy `pp.runpp()`, và xuất ra định dạng JSON chứa trạng thái thiết bị.

**Phase 2: Backend API & WebSocket (FastAPI)**
- Task: Khởi tạo project FastAPI. Tích hợp module Phase 1 vào.
- Task: Xây dựng REST endpoint quản lý dữ liệu lưới điện.
- Task: Thiết lập WebSockets. Tạo một Background Task chạy mô phỏng mỗi 2 giây và gửi JSON result qua kênh WebSocket.

**Phase 3: Database & Auth (PostgreSQL)**
- Task: Khởi tạo Models (SQLAlchemy). Bảng: User, GridModel, Scenario, Session, SessionLog.
- Task: Làm chức năng JWT Authentication.

**Phase 4: Frontend Base & SLD (React)**
- Task: Khởi tạo Next.js/React project.
- Task: Xây dựng Component SLD sử dụng `React Flow`. Map dữ liệu JSON từ Backend thành các Nodes (Bus) và Edges (Lines).
- Task: Kết nối WebSocket client để liên tục cập nhật UI (thay đổi state màu sắc, thông số text).

**Phase 5: Trainee Actions & Instructor Dashboard**
- Task: Thêm các Modal xác nhận thao tác khi click vào node/edge trên Frontend. Gửi action qua API tới Backend.
- Task: Làm màn hình quản lý Timeline cho Instructor.

## 6. AGENT SYSTEM PROMPTS & RULES
- **Rule 1:** Modularize the simulation logic. Keep the `pandapower` wrapper completely separate from FastAPI routing.
- **Rule 2:** Error handling is critical in the simulation loop. If `runpp()` fails to converge (non-convergence due to voltage collapse), the app must NOT crash. Catch the exception and broadcast a "SYSTEM COLLAPSE" event to the frontend.
- **Rule 3:** Use standard electrical units in JSON payloads: `vm_pu` (Voltage p.u.), `p_mw` (Active Power MW), `q_mvar` (Reactive Power MVAr), `loading_percent` (Line loading %).
- **Rule 4:** Initially, hardcode the grid topology to test the full stack (WebSocket to React) before building the dynamic Topology Builder UI.