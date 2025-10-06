"""
Main entry point for Threads Feed Scraper
Handles user interaction and main control loop
"""
import time
from scraper import ThreadsFeedScraper
from api_client import APIClient
from config import DEFAULT_INTERVAL, THREADS_URL


def print_header():
    """Print program header"""
    print("=" * 60)
    print("Threads Feed Real-time Scraper - Manual Control Version")
    print("=" * 60)
    print(f"Backend API: {APIClient().base_url}")
    print("=" * 60)


def get_scraping_interval() -> float:
    """
    Get scraping interval from user input
    
    Returns:
        Scraping interval in seconds
    """
    print("\nSet scraping interval (seconds):")
    interval_input = input(f"Enter seconds [default: {DEFAULT_INTERVAL}]: ").strip()
    return float(interval_input) if interval_input else DEFAULT_INTERVAL


def wait_for_login(scraper: ThreadsFeedScraper):
    """Wait for user to complete login"""
    scraper.navigate_to(THREADS_URL)
    print("\n⚠️  Please login to Threads in the browser (if needed)")
    print("After login, return here and press Enter to continue...")
    input()


def print_instructions(interval: float):
    """Print manual control mode instructions"""
    print("\n" + "=" * 60)
    print("Manual Control Mode")
    print("=" * 60)
    print(f"• Program will auto-scrape new posts every {interval} seconds")
    print("• You can freely scroll the page in the browser")
    print("• Only visible posts will be scraped, no duplicates")
    print("• Press Ctrl+C to stop the program")
    print("=" * 60 + "\n")


def run_scraping_loop(scraper: ThreadsFeedScraper, api_client: APIClient, interval: float):
    """
    Main scraping loop
    
    Args:
        scraper: ThreadsFeedScraper instance
        api_client: APIClient instance
        interval: Scraping interval in seconds
    """
    print("Starting monitoring...\n")
    loop_count = 0
    
    while True:
        loop_count += 1
        print(f"[Scan #{loop_count} - {time.strftime('%H:%M:%S')}]")
        
        posts = scraper.get_visible_posts()
        
        if posts:
            api_client.send_posts(posts)
        
        print(f"  Total posts processed: {scraper.get_total_processed()}")
        print()
        
        time.sleep(interval)


def main():
    """Main program execution"""
    print_header()
    
    scraper = ThreadsFeedScraper(headless=False)
    api_client = APIClient()
    
    # Test backend connection
    print("\nTesting backend connection...")
    if not api_client.test_connection():
        print("\n⚠️  Warning: Can't connect to backend, but scraper will continue")
        print("   Scraped data won't be sent. Please check if backend is running\n")
        continue_anyway = input("Continue anyway? (y/n): ").strip().lower()
        if continue_anyway != 'y':
            print("Execution cancelled")
            scraper.close()
            return
    
    # Get user preferences
    interval = get_scraping_interval()
    
    try:
        # Setup and login
        wait_for_login(scraper)
        print_instructions(interval)
        
        # Run main loop
        run_scraping_loop(scraper, api_client, interval)
        
    except KeyboardInterrupt:
        print("\n\nUser interrupted, closing...")
    except Exception as e:
        print(f"\nError occurred: {e}")
        import traceback
        traceback.print_exc()
    finally:
        scraper.close()
        print("Scraper closed")
        print(f"Total unique posts processed: {scraper.get_total_processed()}")


if __name__ == "__main__":
    main()