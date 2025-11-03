import urllib.request
import sys

try:
    response = urllib.request.urlopen('https://p5jloijxcto3.space.minimax.io')
    html = response.read().decode('utf-8')
    print(f"HTTP Status: {response.status}")
    print(f"Content Length: {len(html)} bytes")
    print("\nFirst 500 characters:")
    print(html[:500])
    
    # Check for key subscription elements
    checks = {
        'React App': '<div id="root">' in html,
        'Vite Build': 'type="module"' in html,
        'Has Scripts': '<script' in html,
        'Has Styles': 'stylesheet' in html
    }
    print("\n=== Deployment Checks ===")
    for check, result in checks.items():
        status = '✓' if result else '✗'
        print(f"{status} {check}")
        
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
