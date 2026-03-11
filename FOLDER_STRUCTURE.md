# 📁 Unimate - Folder Structure Guide

## Overview
This document explains the purpose and responsibility of each folder in the Unimate project.

---

## 📂 Project Structure

```
unimate/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Full page views
│   ├── routes/          # Routing configuration
│   ├── styles/          # CSS styling files
│   ├── assets/          # Images, icons, and static files
│   ├── supabaseClient.js  # Supabase connection setup
│   ├── App.jsx          # Main application component
│   ├── App.css          # Global app styles
│   ├── main.jsx         # Application entry point
│   └── index.css        # Base CSS styles
├── .env                 # Environment variables (DO NOT COMMIT!)
├── .gitignore          # Files to exclude from git
├── package.json        # Project dependencies
└── vite.config.js      # Vite configuration
```

---

## 📁 Folder Responsibilities

### 🧩 **src/components/**
**Purpose**: Reusable UI components that can be used across multiple pages

**What goes here**:
- Navbar, Footer, Buttons
- Cards, Modals, Forms
- Any component used in multiple places

**Current components**:
- `Navbar.jsx` - Navigation bar with links to all pages

**Example**: If you need a `ProductCard` component that appears on both Marketplace and Profile pages, create it here.

---

### 📄 **src/pages/**
**Purpose**: Complete page views that represent different routes in your application

**What goes here**:
- Landing page
- Login/Register pages
- Marketplace, Profile pages
- Any full-page view

**Current pages**:
- `Landing.jsx` - Homepage with project introduction
- `Marketplace.jsx` - Product listings page
- `Login.jsx` - User login page
- `Register.jsx` - User signup page
- `Profile.jsx` - User profile page

**Note**: These are ***not*** reusable components. Each represents a unique page in your app.

---

### 🛤️ **src/routes/**
**Purpose**: Routing configuration and route management

**What goes here**:
- Router setup with all app routes
- Protected route wrappers (for authenticated pages)
- Route configuration

**Current files**:
- `AppRoutes.jsx` - Main routing configuration with all page routes

---

### 🎨 **src/styles/**
**Purpose**: CSS files for styling components and pages

**What goes here**:
- Component-specific CSS files
- Page-specific CSS files
- Utility/helper CSS

**Current files**:
- `Navbar.css` - Navbar component styles
- `Landing.css` - Landing page styles
- `Marketplace.css` - Marketplace page styles
- `Auth.css` - Login/Register page styles
- `Profile.css` - Profile page styles

**Best practice**: Keep CSS modular. Each component/page should have its own CSS file.

---

### 🖼️ **src/assets/**
**Purpose**: Static files like images, icons, logos, and media

**What goes here**:
- Product images
- Logo files
- Icons
- Background images
- Any static media

**Current**: Empty (will be filled in later phases)

---

### ⚙️ **src/supabaseClient.js**
**Purpose**: Supabase database connection configuration

**What it does**:
- Creates and exports the Supabase client
- Reads credentials from environment variables
- Provides a connection test function

**Usage**:
```javascript
import { supabase } from './supabaseClient';
```

---

## 🔐 Environment Variables

### **.env file**
**Purpose**: Store sensitive configuration like API keys

**Current variables**:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**⚠️ IMPORTANT**: 
- NEVER commit `.env` to git
- The `.gitignore` file is already configured to exclude it
- Each developer needs their own `.env` file with their credentials

---

## 🚀 Getting Started

### For New Developers:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   - Open `.env` file
   - Replace placeholder values with your Supabase credentials
   - Get credentials from [Supabase Dashboard](https://app.supabase.com)

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   - Navigate to `http://localhost:5173`

---

## 📝 Development Workflow

### Adding a New Page:
1. Create component in `src/pages/YourPage.jsx`
2. Create CSS in `src/styles/YourPage.css`
3. Add route in `src/routes/AppRoutes.jsx`
4. Add navigation link in `src/components/Navbar.jsx`

### Adding a New Component:
1. Create component in `src/components/YourComponent.jsx`
2. Create CSS in `src/styles/YourComponent.css`
3. Import and use wherever needed

---

## 🎯 Phase 0 Complete!

You now have:
- ✅ Clean, organized folder structure
- ✅ Routing with all placeholder pages
- ✅ Supabase connection ready
- ✅ Professional navigation
- ✅ Modern, clean styling

**Next Steps** (Future Phases):
- Add Supabase database tables
- Implement authentication
- Build real product listings
- Add chat functionality
- Implement payment system
