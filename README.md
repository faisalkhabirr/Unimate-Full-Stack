# Unimate – Student Marketplace

> A project by **Purple Tech**

Unimate is a modern student-focused marketplace designed for buying and selling items within a campus community. It provides a clean, minimal interface backed by secure authentication, real-time messaging, and a scalable backend powered by Supabase.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Documentation](#documentation)
- [Resources](#resources)

---

## Overview

Unimate enables students to list products, browse available items, communicate directly with sellers, and manage transactions in a secure and responsive environment. The project is built with real-world marketplace workflows in mind, emphasizing clean architecture, reliability, and usability.

---

## Features

- 🔐 Secure user authentication using Supabase Auth
- 🛒 Marketplace with searchable and categorized listings
- 📦 Product condition handling (new / used)
- 💬 Real-time messaging between buyers and sellers
- 🤝 Deal tracking and sold item management
- 👤 User profile management with listing and deal history
- 💾 Saved items / wishlist functionality
- ⚙️ Account settings and security management
- 📱 Fully responsive design for desktop and mobile devices

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | [React 19](https://react.dev/) + [Vite](https://vite.dev/) |
| Routing   | [React Router v7](https://reactrouter.com/)     |
| Backend   | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage + Edge Functions) |
| UI Icons  | [Lucide React](https://lucide.dev/) + [Font Awesome](https://fontawesome.com/) |
| Components| [Radix UI](https://www.radix-ui.com/)           |
| Deployment| [Vercel](https://vercel.com/)                   |

---

## Prerequisites

Before running the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) v16 or later
- A [Supabase](https://supabase.com/) account

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/iftakharH/unimate.git
cd unimate
npm install
```

### 2. Environment Configuration

Create a `.env` file from the provided example:

```bash
cp .env.example .env
```

Open `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

To find these values:

1. Open the [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings → API**
4. Copy the **Project URL** and **anon public** key

### 3. Database Setup

Set up the required database schema using the **Supabase SQL Editor** ([app.supabase.com](https://app.supabase.com) → your project → SQL Editor).

You will need to create the following:

- **Listings table** – stores product listings with Row Level Security (RLS) policies
- **Chats, Messages, and Deals tables** – supports real-time messaging and deal tracking with RLS

Enable Row Level Security on all tables and configure appropriate policies for authenticated users.

### 4. Storage Configuration

1. Open the **Storage** section in your Supabase project
2. Create a public bucket named `listing-images`
3. Configure RLS policies to allow authenticated users to upload images

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at:

```
http://localhost:5173
```

---

## Project Structure

```
unimate/
├── public/                  Static public assets
├── src/
│   ├── assets/              Images, icons, and static media
│   ├── components/          Reusable UI components
│   │   ├── Footer.jsx
│   │   ├── FullPageLoader.jsx
│   │   ├── ListingCountdown.jsx
│   │   ├── Modal.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProductModal.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── PushInitializer.jsx
│   ├── context/             Global state management (AuthContext)
│   ├── pages/               Application pages
│   │   ├── AdminPanel.jsx
│   │   ├── Chat.jsx
│   │   ├── CreateListing.jsx
│   │   ├── EditListing.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Marketplace.jsx
│   │   ├── Messages.jsx
│   │   ├── MyDeals.jsx
│   │   ├── MyListings.jsx
│   │   ├── ProductPage.jsx
│   │   ├── Profile.jsx
│   │   ├── Register.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── SavedItems.jsx
│   │   ├── Security.jsx
│   │   ├── Settings.jsx
│   │   └── UserProfile.jsx
│   ├── routes/              Routing configuration (AppRoutes.jsx)
│   ├── services/            API and service helpers
│   │   ├── chatService.js
│   │   ├── listingService.js
│   │   └── reviewService.js
│   ├── styles/              Application styles
│   ├── utils/               Utility/helper functions
│   ├── App.jsx              Root application component
│   ├── App.css              Global application styles
│   ├── index.css            Base CSS styles
│   ├── main.jsx             Application entry point
│   └── supabaseClient.js    Supabase client initialization
├── supabase/
│   └── functions/           Supabase Edge Functions
├── .env.example             Environment variable template
├── .gitignore
├── index.html
├── package.json
├── vercel.json              Vercel deployment configuration
└── vite.config.js           Vite build configuration
```

---

## Available Scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start the development server         |
| `npm run build`   | Create a production build            |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint to check code quality     |

---

## Deployment

### Deploying to Vercel

1. Push the project to GitHub
2. Import the repository into [Vercel](https://vercel.com/)
3. Add the following environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy the project

> **Note:** A `vercel.json` with SPA rewrite rules is already included in the repository.

### Deploying to Netlify

1. Build the project:
   ```bash
   npm run build
   ```
2. Upload the `dist/` folder to [Netlify](https://www.netlify.com/)
3. Configure environment variables in **Site Settings → Environment Variables**

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Supabase connection errors** | Verify that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correctly set in `.env` and the Supabase project is active. |
| **No listings displayed** | Confirm that listings exist in the database and that RLS policies allow read access for authenticated users. |
| **Image upload issues** | Check that the `listing-images` bucket exists in Supabase Storage and is configured as public with the correct RLS policies. |
| **Blank page after deployment** | Ensure `vercel.json` (or equivalent redirect rules for Netlify) is present so all routes fall through to `index.html`. |

---

## Security Considerations

- **Never** commit your `.env` file to version control — it is already listed in `.gitignore`
- Always enable **Row Level Security (RLS)** on all Supabase tables in production
- Keep your Supabase API keys private; rotate them immediately if exposed
- Use the `anon` key only on the client side; use the `service_role` key only in secure server environments

---

## Documentation

| Document | Description |
|----------|-------------|
| **[STYLES_DOCUMENTATION.md](./STYLES_DOCUMENTATION.md)** | Comprehensive styling architecture guide |
| **[STYLES_QUICK_REFERENCE.md](./docs/STYLES_QUICK_REFERENCE.md)** | Quick reference for common styling patterns |
| **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** | Project folder structure explanation |

---

## Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [Lucide React Icons](https://lucide.dev/)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)

---

*Built for students, focused on simplicity, scalability, and real-world usability.*