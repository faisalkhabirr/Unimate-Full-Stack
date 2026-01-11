# 🎓 Unimate - Student Marketplace

**A project of Purple Tech.**

A modern, minimal student marketplace for buying and selling items on campus. Built with React, Vite, and Supabase.

---

## ✨ Features

- 🔐 **Authentication**: Secure signup/login with Supabase Auth
- 🛍️ **Marketplace**: Browse and search listings with real-time data
- 💬 **Real-time Chat**: Message sellers directly with live updates
- 🤝 **Deals**: Mark items as sold and track transactions
- 👤 **Profile Management**: Manage your listings and view deal history  
- 📱 **Responsive Design**: Works beautifully on all devices

---

## 📦 Prerequisites

- Node.js v16+ ([Download](https://nodejs.org))
- A Supabase account ([Sign up free](https://supabase.com))

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd unimate
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Then fill in your Supabase credentials in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> **Where to find these:**
> 1. Go to [Supabase Dashboard](https://app.supabase.com)
> 2. Select your project
> 3. Navigate to **Settings** → **API**
> 4. Copy "Project URL" and "Project API keys (anon public)"

### 3. Set Up Database

Run the following SQL scripts in your Supabase SQL Editor:

1. **`supabase_schema.sql`** - Creates `listings` table and RLS policies
2. **`chat_schema.sql`** - Creates `chats`, `messages`, and `deals` tables with RLS

Both files are located in the project root.

### 4. Configure Storage

1. Go to **Storage** in your Supabase Dashboard
2. Create a new **public** bucket named `listing-images`
3. RLS policies are already set up via the SQL scripts

### 5. Run Development Server

```bash
npm run dev
```

Visit **http://localhost:5173** to see your app!

---

## 📁 Project Structure

```
src/
├── components/        # Reusable components (Navbar, ProtectedRoute)
├── context/           # React Context (AuthContext)
├── pages/             # Page components
│   ├── Landing.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Marketplace.jsx
│   ├── CreateListing.jsx
│   ├── Chat.jsx
│   ├── Messages.jsx
│   ├── MyListings.jsx
│   ├── MyDeals.jsx
│   └── Profile.jsx
├── routes/            # React Router configuration
├── services/          # API helpers (chatService)
├── styles/            # CSS modules
└── supabaseClient.js  # Supabase initialization
```

---

## 🎯 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Deploy to Netlify

1. Build the project: `npm run build`
2. Drag the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)
3. Configure environment variables in **Site settings** → **Build & deploy** → **Environment**

---

## 🐛 Troubleshooting

**Issue**: "Supabase connection failed"
- **Fix**: Check that your `.env` file has correct credentials

**Issue**: "No items showing in Marketplace"
- **Fix**: Create a listing via `/create-listing` or check RLS policies

**Issue**: "Cannot upload images"
- **Fix**: Verify `listing-images` bucket exists and is set to **public**

---

## 🔒 Security Notes

- Never commit `.env` to version control (already in `.gitignore`)
- Use Row Level Security (RLS) in production
- Keep your Supabase keys secure

---

## 📚 Learn More

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Supabase Docs](https://supabase.com/docs)
- [React Router](https://reactrouter.com)

---

**Built with ❤️ for students, by students**
