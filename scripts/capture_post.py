import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

def take_screenshot(url, output_path, element_id, width, height, wait_time):
    # Ensure output directory exists
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to match desired output size
        page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=2)
        
        try:
            print(f"🌍 Navigating to {url}")
            page.goto(url, wait_until="networkidle")
            page.wait_for_timeout(wait_time)
            
            # Hide analytics tooling overlaps if present
            page.add_style_tag(content="#__next-build-watcher, [data-nextjs-tooltip] { display: none !important; }")
            
            # Locate the specific element (slide or story)
            locator = page.locator(f"#{element_id}")
            
            if locator.count() > 0:
                print(f"📸 Capturing {element_id}...")
                locator.screenshot(path=output_path, type="png")
                
                # Save HTML snapshot for debugging/backup
                with open(output_path.replace('.png', '.html'), 'w', encoding='utf-8') as f:
                    f.write(page.content())
                    
                print(f"✅ Saved to {output_path}")
            else:
                print(f"❌ Element #{element_id} not found on page.")
                
        except Exception as e:
            print(f"❌ Error focusing {element_id}: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True, help="URL to capture")
    parser.add_argument("--output", required=True, help="Path to save the PNG")
    parser.add_argument("--element", required=True, help="ID of the element to capture")
    parser.add_argument("--width", type=int, default=1080)
    parser.add_argument("--height", type=int, default=1350)
    parser.add_argument("--wait", type=int, default=2000, help="Wait time in ms")
    
    args = parser.parse_args()
    
    take_screenshot(args.url, args.output, args.element, args.width, args.height, args.wait)
