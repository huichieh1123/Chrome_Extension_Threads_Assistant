"""
API Client for Threads Feed Scraper
Handles all backend communication
"""
import requests
from typing import List, Dict, Optional
from config import API_BASE_URL, API_ENDPOINT, API_TIMEOUT


class APIClient:
    """Handles communication with backend API"""
    
    def __init__(self):
        """Initialize API client"""
        self.base_url = API_BASE_URL
        self.endpoint = API_ENDPOINT
        self.timeout = API_TIMEOUT
    
    def test_connection(self) -> bool:
        """
        Test backend connection
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            if response.status_code == 200:
                print(f"  ✓ Backend connected: {self.base_url}")
                return True
            else:
                print(f"  ✗ Backend error: {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"  ✗ Can't connect to backend: {self.base_url}")
            print("    Please check if backend is running")
            return False
            
        except Exception as e:
            print(f"  ✗ Connection test failed: {e}")
            return False
    
    def send_posts(self, posts: List[Dict]) -> Optional[Dict]:
        """
        Send post data to backend API
        
        Args:
            posts: List of post dictionaries to send
            
        Returns:
            Dict with response data if successful, None otherwise
        """
        if not posts:
            return None
        
        try:
            payload = {'posts': posts}
            
            response = requests.post(
                self.endpoint,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"  ✓ Successfully sent {len(posts)} new posts")
                print(f"    Backend now has {result.get('total_stored', '?')} posts total")
                return result
            else:
                print(f"  ✗ Backend response error: {response.status_code}")
                print(f"    Response content: {response.text[:100]}")
                return None
                
        except requests.exceptions.ConnectionError:
            print(f"  ✗ Can't connect to backend API: {self.endpoint}")
            print("    Please check if backend is running")
            return None
            
        except requests.exceptions.Timeout:
            print("  ✗ Request timeout")
            return None
            
        except Exception as e:
            print(f"  ✗ Error sending data: {e}")
            return None