# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LunchSelector is a React-based web application that recommends lunch menu options with smooth animations and a modern UI. The app categorizes menus by cuisine type and provides random recommendations.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:8888)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Technology Stack

- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.8
- **Language**: JavaScript (JSX)
- **Styling**: CSS3 with animations and gradients

## Project Structure

```
src/
├── main.jsx          # React entry point
├── App.jsx           # Main application component
├── App.css           # Main application styles
├── index.css         # Global styles
└── menuData.js       # Menu data and recommendation logic
```

## Architecture

### Menu Data Structure (`menuData.js`)

- **menuData**: Object containing 5 cuisine categories (한식, 중식, 일식, 양식, 분식)
- **categories**: Array of category names
- **getRandomMenuFromCategory(category)**: Returns random menu from specific category
- **getRandomCategory()**: Returns random category
- **getRandomMenu()**: Returns { category, menu } from all available options

### Application Component (`App.jsx`)

The main component manages:
- **State**: selectedMenu, selectedCategory, isAnimating
- **Category Selection**: Buttons for each cuisine type
- **Random Recommendation**: Button for fully random selection
- **Result Display**: Animated card showing recommended menu with category

### Animation System

All animations use CSS transitions and keyframes:
- **fadeInUp**: Container entrance animation
- **slideIn**: Title animation
- **pulse**: Loading/transition animation
- **cardAppear**: Result card entrance with 3D effect
- **menuBounce**: Menu text bounce animation
- Smooth hover effects with transform and box-shadow transitions

## Design Requirements

### Core Principles

1. **Menu Categories**: Korean (한식), Chinese (중식), Japanese (일식), Western (양식), Korean street food (분식)
2. **Single Recommendation**: Only one menu item displayed at a time
3. **Korean Language**: All UI text in Korean
4. **Clean UI**: Simple, modern, and easy to use
5. **Smooth Animations**: All interactions include smooth transitions

### Visual Design

- Gradient backgrounds (purple theme: #667eea → #764ba2)
- Rounded corners (border-radius: 12-24px)
- Smooth shadows and hover effects
- Responsive design for mobile and desktop
- CSS transitions: 0.3s cubic-bezier easing

## Adding New Features

### Adding New Menu Items

Edit `src/menuData.js` and add items to the appropriate category array:

```javascript
export const menuData = {
  한식: ['새로운메뉴', ...],
  // ...
};
```

### Adding New Categories

1. Add new category to `menuData` object in `src/menuData.js`
2. Category buttons will automatically render in `App.jsx`
3. Add category-specific styling in `App.css` if needed

### Modifying Animations

Edit `src/App.css` and adjust:
- `@keyframes` rules for animation behavior
- `transition` properties for interaction timing
- `animation` properties on elements

## Development Notes

- Vite provides fast HMR (Hot Module Replacement)
- React components use functional components with hooks
- All animations are CSS-based (no JS animation libraries)
- State management uses React useState (no external state library)
