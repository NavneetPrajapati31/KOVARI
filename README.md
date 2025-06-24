# KOVARI - Modern SaaS Application

A modern, full-stack SaaS application built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- Modern UI with Tailwind CSS
- Type-safe development with TypeScript
- Authentication with Clerk
- Database integration with Supabase
- Form handling with React Hook Form and Zod validation
- Smooth animations with Framer Motion
- Responsive design
- Component-based architecture

## 🛠️ Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Clerk
- **Database:** Supabase
- **Form Handling:** React Hook Form + Zod
- **UI Components:** Radix UI
- **Animations:** Framer Motion
- **Icons:** Lucide React

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/navneetprajapati31/kovari.git
cd kovari
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your environment variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Project Structure

```
src/
├── app/          # Next.js app directory (pages and layouts)
├── components/   # Reusable UI components
├── lib/          # Utility functions and configurations
└── middleware.ts # Next.js middleware for authentication
```

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📝 License

This is a private project owned by our team. All rights reserved.

## 👥 Team

- Team KOVARI
