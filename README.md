# 🍿 J1 Movies

> A personal cinema streaming and discovery platform with rich TMDB metadata, high-definition posters, Videasy playback, and zero-database local storage.

---

## ✨ Features

- 🎬 **Extensive Cinema Catalog:** Browse trending, popular, and top-rated movies & TV series powered by the TMDB API.
- ⚡ **Seamless Playback:** High-definition video player with native fullscreen, theater mode, and episode navigation.
- 🎭 **Actor & Director Filmography:** Explore biographies and complete career filmographies with instant watch links.
- 🎛️ **Advanced Discovery Filter Suite:** Filter by release year, minimum TMDB rating, language/region, and genres.
- 👁️ **Instant Quick Preview:** Netflix-style trailer popups without losing your place in the catalog.
- 📁 **Custom Watchlist & Collections:** Zero-database library saved directly to browser `localStorage`.
- 💾 **1-Click JSON Backup & Restore:** Export or import your watchlist and watch history to any device.
- 🌙 **Dark Luxury Cinema UI:** Built with Tailwind CSS, glassmorphism, ambient ambilight halo, and smooth micro-interactions.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16 (App Router & Turbopack)](https://nextjs.org/)
- **UI & Styling:** [Tailwind CSS](https://tailwindcss.com/), Lucide Icons
- **State Management:** Zero-dependency React `useSyncExternalStore`
- **Metadata Provider:** [The Movie Database (TMDB) API](https://www.themoviedb.org/)
- **Video Embed Provider:** [Videasy](https://player.videasy.net/)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/EsBazza/j1-movies.git
cd j1-movies
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
TMDB_API_KEY=your_tmdb_api_key_here
# OR
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token_here
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Vercel Deployment

1. Import the repository into [Vercel](https://vercel.com/new).
2. Add your `TMDB_API_KEY` (or `TMDB_READ_ACCESS_TOKEN`) in **Environment Variables**.
3. Deploy!

---

## 📄 License
This project is licensed under the MIT License. Made with ❤️ by **bazza**.
