import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        console_errors = []
        page_errors = []

        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        file_path = "file://" + os.path.abspath("index.html")
        print(f"Loading {file_path}...")
        await page.goto(file_path, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2500)

        print(f"Console errors on load: {len(console_errors)} -> {console_errors}")
        print(f"Page errors on load: {len(page_errors)} -> {page_errors}")

        # Assert no errors on load
        assert len(console_errors) == 0, f"Unexpected console errors: {console_errors}"
        assert len(page_errors) == 0, f"Unexpected page errors: {page_errors}"

        # 1. Test Module 1 Slider interaction
        print("Testing Module 1 Slider (Rate)...")
        slider_rate = page.locator("#m1SliderRate")
        await slider_rate.evaluate("el => { el.value = '12.0'; el.dispatchEvent(new Event('input')); }")
        await page.wait_for_timeout(400)
        rate_val = await page.locator("#m1ValRate").inner_text()
        print(f"Module 1 Rate value: {rate_val}")
        assert "12" in rate_val

        # 2. Test Module 2 Waterfall
        print("Testing Module 2 Waterfall (Revenue)...")
        slider_rev = page.locator("#m2SliderRev")
        await slider_rev.evaluate("el => { el.value = '1500'; el.dispatchEvent(new Event('input')); }")
        await page.wait_for_timeout(400)
        rev_val = await page.locator("#m2ValRev").inner_text()
        print(f"Module 2 Revenue value: {rev_val}")
        assert "1" in rev_val

        # 3. Test Module 3 WACC & Hamada
        print("Testing Module 3 WACC...")
        wacc_text = await page.locator("#m3OutWacc").inner_text()
        print(f"Module 3 WACC: {wacc_text}")
        assert "%" in wacc_text

        # 4. Test Module 4 Method Switch
        print("Testing Module 4 Method Switch...")
        btn_mult = page.locator("#m4BtnMultiple")
        await btn_mult.click()
        await page.wait_for_timeout(400)
        mult_visible = await page.locator("#m4MultipleControls").is_visible()
        print(f"Module 4 Multiple controls visible: {mult_visible}")
        assert mult_visible

        # Switch back to Gordon
        await page.locator("#m4BtnGordon").click()
        await page.wait_for_timeout(300)

        # 5. Test Module 5 Equity Bridge
        print("Testing Module 5 Equity Bridge...")
        implied_price_m5 = await page.locator("#m5OutImpliedPrice").inner_text()
        print(f"Module 5 Implied Price: {implied_price_m5}")
        assert "PLN" in implied_price_m5

        # 6. Test Module 6 Sensitivity Table
        print("Testing Module 6 Sensitivity Table...")
        cells_count = await page.locator("#m6TableBody td").count()
        print(f"Sensitivity table cells count: {cells_count}")
        assert cells_count >= 25, "Expected at least 25 cells in 5x5 matrix"

        # 7. Test Module 7 Monte Carlo
        print("Testing Module 7 Monte Carlo...")
        btn_sim = page.locator("#m7BtnRun")
        await btn_sim.scroll_into_view_if_needed()
        await btn_sim.click()
        await page.wait_for_timeout(1000)
        p50_val = await page.locator("#m7OutP50").inner_text()
        print(f"Module 7 P50 median: {p50_val}")
        assert "zł" in p50_val

        # 8. Test Module 8 Archetype Tabs
        print("Testing Module 8 Archetypes...")
        tab_saas = page.locator("button[data-archetype='saas']")
        await tab_saas.scroll_into_view_if_needed()
        await tab_saas.click()
        await page.wait_for_timeout(500)
        arch_title = await page.locator("#m8ArchTitle").inner_text()
        print(f"Module 8 Archetype title: {arch_title}")
        assert "SaaS" in arch_title

        # 9. Test Module 10 Quiz
        print("Testing Module 10 Quiz...")
        opt_q1_b = page.locator("button[data-qid='q1'][data-ans='B']")
        await opt_q1_b.scroll_into_view_if_needed()
        await opt_q1_b.click()
        await page.wait_for_timeout(400)
        
        opt_q2_c = page.locator("button[data-qid='q2'][data-ans='C']")
        await opt_q2_c.click()
        await page.wait_for_timeout(400)

        score_text = await page.locator("#quizScoreText").inner_text()
        print(f"Quiz Score: {score_text}")
        assert "2 / 6" in score_text

        # 10. Test Module 11 Python Modal
        print("Testing Python Modal...")
        btn_py = page.locator("#btnOpenPythonModal")
        await btn_py.click()
        await page.wait_for_timeout(300)
        modal_visible = await page.locator("#pythonModal").is_visible()
        print(f"Python modal visible: {modal_visible}")
        assert modal_visible

        btn_close = page.locator("#btnClosePythonModal")
        await btn_close.click()
        await page.wait_for_timeout(300)
        modal_closed = not (await page.locator("#pythonModal").is_visible())
        assert modal_closed

        # Quality Gate: SVG Text Clipping & DOM Overflow Check
        print("Running Quality Gate: SVG Text Clipping & DOM Overflow Check...")
        clipped_svg = await page.evaluate('''() => {
            const issues = [];
            document.querySelectorAll('svg').forEach(svg => {
                const vb = svg.viewBox.baseVal;
                if (!vb || vb.width === 0) return;
                svg.querySelectorAll('text, tspan').forEach(t => {
                    const text = t.textContent.trim();
                    if (!text) return;
                    try {
                        const bbox = t.getBBox();
                        if (bbox.x < vb.x - 2 || (bbox.x + bbox.width) > (vb.x + vb.width + 2)) {
                            issues.push({ text: text, x: bbox.x, width: bbox.width, vb_x: vb.x, vb_w: vb.width });
                        }
                    } catch (e) {}
                });
            });
            return issues;
        }''')
        print(f"SVG Text clipping issues found: {len(clipped_svg)}")
        assert len(clipped_svg) == 0, f"Found clipped SVG text elements: {clipped_svg}"

        # Multi-viewport responsive tests
        viewports = [
            ("Desktop 1440px", {"width": 1440, "height": 900}),
            ("Tablet 768px", {"width": 768, "height": 1024}),
            ("Mobile 375px", {"width": 375, "height": 812})
        ]
        for name, vp in viewports:
            await page.set_viewport_size(vp)
            await page.wait_for_timeout(300)
            has_h_scroll = await page.evaluate('''() => {
                return document.documentElement.scrollWidth > window.innerWidth + 2;
            }''')
            print(f"Viewport {name} -> Horizontal scroll detected: {has_h_scroll}")
            assert not has_h_scroll, f"Horizontal scroll detected on {name}!"

        # Reset viewport to 1440px and capture verified screenshot
        await page.set_viewport_size({"width": 1440, "height": 900})
        screenshot_path = "screenshot_verified.png"
        print(f"Taking full page screenshot to {screenshot_path}...")
        await page.screenshot(path=screenshot_path, full_page=True)
        print("Screenshot saved successfully!")

        await browser.close()
        print("All tests passed with 0 errors!")

if __name__ == "__main__":
    asyncio.run(run_tests())
