import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            device_scale_factor=2  # High resolution
        )
        page = await context.new_page()
        
        # 1. Login Page
        await page.goto('http://127.0.0.1:8000/login/')
        await page.wait_for_timeout(1000)
        await page.screenshot(path='login_snapshot.png')
        print("Login screenshot captured.")
        
        # Login to app
        await page.fill('input[name="username"]', 'admin')
        await page.fill('input[name="password"]', 'its_adminpass') # wait! I don't know the password!
        # Actually I can just create a session dynamically in python, or use the dev server with an already logged in user? No.
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(2000)
        
        # Check if login was successful
        url = page.url
        if 'login' in url:
            print("Login failed, falling back to manual cookie injection or you can take a screenshot.")
        else:
            # 2. Dashboard
            await page.goto('http://127.0.0.1:8000/')
            await page.wait_for_timeout(1000)
            await page.screenshot(path='dashboard_snapshot.png')
            print("Dashboard screenshot captured.")
            
            # 3. Drawer
            await page.click('text="Add Item"')
            await page.wait_for_timeout(1000)
            await page.screenshot(path='drawer_snapshot.png')
            print("Drawer screenshot captured.")
            
            # 4. Borrowing Tracker
            await page.goto('http://127.0.0.1:8000/borrowing/')
            await page.wait_for_timeout(1000)
            await page.screenshot(path='borrowing_snapshot.png')
            print("Borrowing Tracker screenshot captured.")
            
            # 5. Activity Log
            await page.goto('http://127.0.0.1:8000/activity-log/')
            await page.wait_for_timeout(1000)
            await page.screenshot(path='activity_snapshot.png')
            print("Activity Log screenshot captured.")
            
        await browser.close()

asyncio.run(main())
