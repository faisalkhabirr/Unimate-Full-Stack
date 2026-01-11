Unimate – Student Marketplace

A project by Purple Tech

Unimate is a modern student-focused marketplace designed for buying and selling items within a campus community. It provides a clean, minimal interface backed by secure authentication, real-time messaging, and a scalable backend powered by Supabase.

Overview

Unimate enables students to list products, browse available items, communicate directly with sellers, and manage transactions in a secure and responsive environment. The project is built with real-world marketplace workflows in mind, emphasizing clean architecture, reliability, and usability.

Features

Secure user authentication using Supabase Auth

Marketplace with searchable and categorized listings

Product condition handling (new / used)

Real-time messaging between buyers and sellers

Deal tracking and sold item management

User profile management with listing and deal history

Fully responsive design for desktop and mobile devices

Prerequisites

Before running the project, ensure you have the following installed:

Node.js v16 or later

A Supabase account

Getting Started
1. Clone the Repository
git clone <your-repo-url>
cd unimate
npm install

2. Environment Configuration

Create a .env file from the example provided:

cp .env.example .env


Add your Supabase credentials:

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here


To find these values:

Open the Supabase Dashboard

Select your project

Go to Settings → API

Copy the Project URL and anon public key

3. Database Setup

Run the provided SQL scripts in the Supabase SQL Editor:

supabase_schema.sql – Creates listings table and RLS policies

chat_schema.sql – Creates chats, messages, and deals tables with RLS

Both files are located in the project root directory.

4. Storage Configuration

Open the Storage section in Supabase

Create a public bucket named listing-images

Required Row Level Security policies are already included in the SQL setup

5. Run the Development Server
npm run dev


The application will be available at:

http://localhost:5173

Project Structure
src/
├── components/        Reusable UI components
├── context/           Global state management (AuthContext)
├── pages/             Application pages
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
├── routes/            Routing configuration
├── services/          API and service helpers
├── styles/            Application styles
└── supabaseClient.js  Supabase client initialization

Available Scripts
Command	Description
npm run dev	Start the development server
npm run build	Create a production build
npm run preview	Preview the production build locally
Deployment
Deploying to Vercel

Push the project to GitHub

Import the repository into Vercel

Add environment variables:

VITE_SUPABASE_URL

VITE_SUPABASE_ANON_KEY

Deploy the project

Deploying to Netlify

Build the project using npm run build

Upload the dist folder to Netlify

Configure environment variables in site settings

Troubleshooting

Supabase connection errors
Ensure environment variables are correctly set and the Supabase project is active.

No listings displayed
Verify that listings exist in the database and Row Level Security policies allow access.

Image upload issues
Confirm the listing-images bucket exists and is marked as public.

Security Considerations

Do not commit .env files to version control

Always enable Row Level Security in production

Keep Supabase keys private and rotate them if exposed

Resources

React Documentation

Vite Documentation

Supabase Documentation

React Router Documentation

Built for students, focused on simplicity, scalability, and real-world usability.