"""
Core scraper module for Threads Feed
Handles browser automation and data extraction
"""
import time
import hashlib
from typing import List, Dict, Set
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from config import CHROME_OPTIONS, SELECTORS


class ThreadsFeedScraper:
    """Threads Feed Crawler with manual control"""
    
    def __init__(self, headless: bool = False):
        """
        Initialize scraper
        
        Args:
            headless: Whether to run browser in headless mode
        """
        self.driver = self._setup_driver(headless)
        self.processed_posts: Set[str] = set()
    
    def _setup_driver(self, headless: bool) -> webdriver.Chrome:
        """
        Setup Chrome WebDriver with configured options
        
        Args:
            headless: Whether to run in headless mode
            
        Returns:
            Configured Chrome WebDriver instance
        """
        options = Options()
        
        if headless:
            options.add_argument('--headless')
        
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument(f'--user-agent={CHROME_OPTIONS["user_agent"]}')
        options.add_argument(f'--log-level={CHROME_OPTIONS["log_level"]}')
        options.add_argument('--disable-logging')
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        
        return webdriver.Chrome(options=options)
    
    def navigate_to(self, url: str) -> None:
        """
        Navigate to specified URL
        
        Args:
            url: Target URL to navigate to
        """
        print(f"Opening {url}...")
        self.driver.get(url)
        time.sleep(3)
    
    def _find_post_elements(self) -> List:
        """
        Find post elements using configured selectors
        
        Returns:
            List of found post elements
        """
        for selector_type, selector_value in SELECTORS['posts']:
            try:
                if selector_type == 'css':
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector_value)
                elif selector_type == 'tag':
                    elements = self.driver.find_elements(By.TAG_NAME, selector_value)
                
                if elements:
                    return elements
            except:
                continue
        
        return []
    
    def _is_element_visible(self, element, viewport_height: int, scroll_y: int) -> bool:
        """
        Check if element is visible in current viewport
        
        Args:
            element: WebElement to check
            viewport_height: Height of viewport
            scroll_y: Current scroll position
            
        Returns:
            True if element is visible, False otherwise
        """
        try:
            location = element.location
            size = element.size
            
            elem_top = location['y']
            elem_bottom = location['y'] + size['height']
            
            return (elem_top < scroll_y + viewport_height) and (elem_bottom > scroll_y)
        except:
            return False
    
    def _extract_author(self, post_elem) -> str:
        """Extract author name from post element"""
        for selector in SELECTORS['author']:
            try:
                author_elem = post_elem.find_element(By.CSS_SELECTOR, selector)
                if author_elem and author_elem.text.strip():
                    return author_elem.text.strip()
            except:
                continue
        return "Unknown"
    
    def _extract_text(self, post_elem, author: str = "") -> str:
        """
        Extract text content from post element
        Uses multiple strategies to get complete post content
        
        Args:
            post_elem: Post element to extract from
            author: Author name to filter out (optional)
        """
        # Strategy 1: Try to get complete text from the entire post element
        try:
            full_text = post_elem.text.strip()
            if full_text and full_text != author and len(full_text) > len(author):
                # Remove author name if it appears at the start
                if full_text.startswith(author):
                    full_text = full_text[len(author):].strip()
                
                # If we got substantial content, use it
                if len(full_text) > 20:  # Arbitrary threshold for "real content"
                    return full_text
        except:
            pass
        
        # Strategy 2: Use selectors to find the longest text block
        candidate_text = ""
        max_length = 0
        
        for selector in SELECTORS['text']:
            try:
                text_elems = post_elem.find_elements(By.CSS_SELECTOR, selector)
                for elem in text_elems:
                    elem_text = elem.text.strip()
                    
                    # Skip empty text or just author name
                    if not elem_text or elem_text == author:
                        continue
                    
                    # Keep the text that contains the most content
                    if len(elem_text) > max_length:
                        max_length = len(elem_text)
                        candidate_text = elem_text
                        
            except:
                continue
        
        return candidate_text
    
    def _extract_link(self, post_elem) -> str:
        """Extract post URL from post element"""
        for selector in SELECTORS['link']:
            try:
                link_elem = post_elem.find_element(By.CSS_SELECTOR, selector)
                if link_elem:
                    return link_elem.get_attribute('href')
            except:
                continue
        return ""
    
    def _generate_post_id(self, post_elem) -> str:
        """Generate unique ID for post based on HTML content"""
        post_html = post_elem.get_attribute('outerHTML')
        return hashlib.md5(post_html.encode()).hexdigest()
    
    def get_visible_posts(self) -> List[Dict]:
        """
        Scrape posts currently visible on screen
        
        Returns:
            List of post dictionaries with scraped data
        """
        posts = []
        
        try:
            viewport_height = self.driver.execute_script("return window.innerHeight")
            scroll_y = self.driver.execute_script("return window.pageYOffset")
            
            post_elements = self._find_post_elements()
            
            if not post_elements:
                print("✗ Can't find post elements")
                return posts
            
            new_posts_count = 0
            
            for post_elem in post_elements:
                try:
                    if not self._is_element_visible(post_elem, viewport_height, scroll_y):
                        continue
                    
                    post_id = self._generate_post_id(post_elem)
                    
                    if post_id in self.processed_posts:
                        continue
                    
                    author = self._extract_author(post_elem)
                    text = self._extract_text(post_elem, author)
                    link = self._extract_link(post_elem)
                    
                    # Only process posts with actual content (not just author name)
                    if text.strip() and text != author:
                        post_data = {
                            'post_id': post_id,
                            'author': author,
                            'text': text,
                            'url': link,
                            'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S')
                        }
                        
                        posts.append(post_data)
                        self.processed_posts.add(post_id)
                        new_posts_count += 1
                        
                        self._print_post_info(new_posts_count, author, text, link)
                
                except Exception as e:
                    continue
            
            if new_posts_count == 0:
                print("  No new posts on current screen")
        
        except Exception as e:
            print(f"Error during scraping: {e}")
        
        return posts
    
    def _print_post_info(self, count: int, author: str, text: str, link: str) -> None:
        """Print formatted post information"""
        print(f"\n  ✓ Post #{count}")
        print(f"  Author: {author}")
        print(f"  Content:\n{text}")
        if link:
            print(f"  URL: {link}")
        print("-" * 60)
    
    def get_total_processed(self) -> int:
        """Get total number of processed posts"""
        return len(self.processed_posts)
    
    def close(self) -> None:
        """Close browser and cleanup"""
        if self.driver:
            self.driver.quit()