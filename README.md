# Hacker News Explorer 📰

Modern Hacker News clone with modular architecture and intuitive interface, featuring Financial Times-inspired design.

## Features ✨

### 📁 Modular Architecture
Code is now organized into readable modules:
- `state.js` - application state management
- `utils.js` - utility functions and helpers
- `cache.js` - API request caching (30s TTL)
- `posts.js` - post rendering and display
- `comments.js` - comment system management
- `liveData.js` - live updates every 30 seconds
- `app.js` - main application coordinator

### 🔄 UX Improvements
- **Post clicks** now redirect to original Hacker News page
- **Comments** display directly under posts (no modal windows)
- **Live updates** every 30 seconds instead of 5 seconds
- **Financial Times color scheme** for premium reading experience

### 🚀 Performance
- API request caching with 30-second TTL
- Throttling and debouncing for rate limit prevention
- Intersection Observer for lazy loading
- Optimized comment system

## Getting Started

```bash
# Start local server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

## File Structure

```
clonernews/
├── index.html          # Main page
├── style.css           # Styles (FT color scheme, no modals)
├── js/
│   ├── app.js         # Main file (new modular)
│   ├── app-old.js     # Old monolithic file (backup)
│   ├── api.js         # Hacker News API interface
│   ├── state.js       # Application state
│   ├── utils.js       # Utilities
│   ├── cache.js       # Caching layer
│   ├── posts.js       # Post rendering
│   ├── comments.js    # Comment system
│   └── liveData.js    # Live updates
└── README.md          # This file
```

## Key Changes

1. ✅ **Modularity**: Split monolithic `app.js` (633+ lines) into 7 specialized modules
2. ✅ **UX improvements**: Removed modal windows, comments now under posts
3. ✅ **Navigation**: Post clicks redirect to Hacker News
4. ✅ **Performance**: Caching and request optimization
5. ✅ **Stability**: Error handling and fallback values
6. ✅ **Design**: Financial Times-inspired color scheme for premium feel

## Color Scheme 🎨

- **Background**: #E8E4DD (warm cream)
- **Cards/Containers**: rgba(255, 255, 255, 0.8) (translucent white)  
- **Text**: #1A1A18 (deep charcoal)
- **Accents**: #6B4F47 (warm brown)
- **Borders**: #D8C3B0 (soft beige)

The application is now more readable, maintainable, and enjoyable to use! 🎉