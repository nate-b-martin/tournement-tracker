# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - button "Open menu" [ref=e3]:
      - img [ref=e4]
    - heading "TanStack Logo" [level=1] [ref=e5]:
      - link "TanStack Logo" [ref=e6] [cursor=pointer]:
        - /url: /
        - img "TanStack Logo" [ref=e7]
  - complementary [ref=e8]:
    - generic [ref=e9]:
      - heading "Navigation" [level=2] [ref=e10]
      - button "Close menu" [ref=e11]:
        - img [ref=e12]
    - navigation [ref=e15]:
      - link "Home" [ref=e16] [cursor=pointer]:
        - /url: /
        - img [ref=e17]
        - generic [ref=e20]: Home
      - link "Dashboard" [ref=e21] [cursor=pointer]:
        - /url: /dashboard
        - generic [ref=e22]: Dashboard
      - link "Players" [ref=e23] [cursor=pointer]:
        - /url: /playerspage
        - generic [ref=e24]: Players
    - button "Sign in" [ref=e26]
  - generic [ref=e28]:
    - alert [ref=e29]:
      - img [ref=e30]
      - generic [ref=e32]: Authentication Required
      - generic [ref=e33]: Please sign in to access this content.
    - link "Go Home" [ref=e34] [cursor=pointer]:
      - /url: /
  - region "Notifications alt+T"
  - button "Open TanStack Devtools" [ref=e35] [cursor=pointer]:
    - img "TanStack Devtools" [ref=e36]
```