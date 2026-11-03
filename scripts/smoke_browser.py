"""Run with Python + Playwright, against scripts/dev.sh. Uses system Chromium."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/chromium", headless=True,
                                    args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 1440, "height": 1100}, device_scale_factor=1)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto("http://127.0.0.1:5173")
        expect(page.get_by_text("Telemetry trực tuyến", exact=True)).to_be_visible()
        expect(page.get_by_text("Vận hành bình thường", exact=True)).to_be_visible()
        page.get_by_role("combobox", name="Chọn kịch bản").select_option("fault_lt1")
        page.get_by_role("button", name="Phiên mới", exact=True).click()
        expect(page.get_by_text("LT1: bảo vệ tác động, sự cố chưa được xử lý", exact=True)).to_be_visible()
        page.locator('.react-flow__node[data-id="LT1"]').click()
        dialog = page.get_by_role("dialog")
        dialog.get_by_role("button", name="Đóng máy cắt", exact=True).click()
        dialog.get_by_role("button", name="Xác nhận thao tác").click()
        expect(dialog.get_by_role("alert")).to_contain_text("Liên động")
        dialog.get_by_role("button", name="Hủy", exact=True).click()
        dialog.get_by_role("button", name="Xác nhận đã kiểm tra và xử lý sự cố").click()
        expect(dialog.get_by_text("CẮT", exact=True)).to_be_visible()
        dialog.get_by_role("button", name="Đóng máy cắt", exact=True).click()
        dialog.get_by_role("button", name="Xác nhận thao tác").click()
        expect(dialog.get_by_text("ĐÓNG", exact=True)).to_be_visible()
        dialog.get_by_role("button", name="Đóng bảng điều khiển").click()
        expect(page.get_by_text("Hoàn thành sau", exact=False)).to_be_visible()
        expect(page.get_by_text("1 lệnh bị từ chối", exact=True)).to_be_visible()
        page.reload()
        expect(page.get_by_text("Hoàn thành sau", exact=False)).to_be_visible()
        with page.expect_download() as download:
            page.get_by_role("button", name="Xuất báo cáo").click()
        report = json.loads(Path(download.value.path()).read_text())
        assert report['mistakes'] == 1 and report['score'] == 90
        assert report['completed_seconds'] is not None
        page.get_by_role("combobox", name="Chọn kịch bản").select_option("overload")
        page.get_by_role("button", name="Phiên mới", exact=True).click()
        expect(page.get_by_text("MBA T1 quá tải", exact=False)).to_be_visible()
        page.get_by_role("slider", name="Hệ số phụ tải").fill("100")
        page.get_by_role("button", name="Áp dụng phụ tải").click()
        expect(page.get_by_text("Vận hành bình thường", exact=True)).to_be_visible()
        page.screenshot(path="/workspace/mophongscada/.run/desktop.png", full_page=True)
        page.get_by_role("button", name="Bài tập & kịch bản", exact=True).click()
        expect(page.get_by_role("button", name="Bắt đầu thực hành")).to_have_count(3)
        page.get_by_role("button", name="Hướng dẫn thực hành", exact=True).click()
        expect(page.get_by_role("heading", name="Quy trình thực hành")).to_be_visible()
        page.set_viewport_size({"width": 390, "height": 844})
        page.get_by_role("button", name="Trạm mô phỏng", exact=True).click()
        expect(page.locator('.react-flow')).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Mobile overflow'
        page.screenshot(path="/workspace/mophongscada/.run/mobile.png", full_page=True)
        assert not errors, errors
        print('PASS: fault interlock, restoration, reload, report, overload recovery, navigation, mobile; no page errors')
        browser.close()


if __name__ == '__main__':
    main()
