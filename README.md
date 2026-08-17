# ShopEase — Redesign Notes

## What changed
- Every component now has its own `.css` file next to it, no more inline `style={{}}` objects.
- All emoji have been replaced with `react-icons` (mainly `react-icons/fi` for UI actions and `react-icons/tb` for category icons — Tabler Icons ship inside the `react-icons` package you already installed, no extra install needed).
- New design system lives in `src/App.css` as CSS variables (`--ink`, `--paper`, `--primary`, `--accent`, etc.) plus shared classes (`.btn`, `.field-input`, `.tag`, `.price-tag`, `.state-block`) reused across every page — so the whole site shares one visual language instead of each page reinventing buttons and inputs.
- Fonts: `Fraunces` (display/headings), `Inter` (body), `IBM Plex Mono` (prices, labels) — loaded via Google Fonts in `App.css`.
- Layout, copy, and empty/loading states were tightened up; all functionality (auth, cart, orders, admin CRUD) is untouched — only the presentation layer changed.

## How to use this
1. Copy the `src` folder into your existing Vite React project, overwriting the old files (or drop it into a fresh `npm create vite@latest` app with the `react` template).
2. Make sure these are installed (you already have them per your message):
   ```
   npm install react-router-dom react-hot-toast axios react-icons
   ```
3. Run `npm run dev`.

## File map
```
src/
  App.jsx / App.css          → routes + global design tokens
  main.jsx
  api/axios.js                → unchanged
  context/AuthContext.jsx     → unchanged
  components/
    Navbar.jsx / Navbar.css
    Footer.jsx / Footer.css
  pages/
    Home.jsx / Home.css
    Login.jsx / Register.jsx / Auth.css   (shared auth styling)
    Products.jsx / Products.css
    ProductDetail.jsx / ProductDetail.css
    Cart.jsx / Cart.css
    Orders.jsx / Orders.css
    AdminDashboard.jsx / AdminDashboard.css
```
