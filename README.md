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
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase Database (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** You must configure both Clerk and Supabase environment variables for the application to work properly. The Supabase error you're seeing indicates that these variables are missing.

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

## 🔧 Troubleshooting

### Supabase Connection Errors

If you see errors like `❌ Supabase ERROR: {}` or `Supabase environment variables are not configured`, follow these steps:

1. **Check Environment Variables**: Ensure your `.env.local` file exists and contains the required Supabase variables:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Get Supabase Credentials**:
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to Settings → API
   - Copy the "Project URL" and "anon public" key

3. **Restart Development Server**: After adding environment variables, restart your dev server:

   ```bash
   npm run dev
   ```

4. **Verify Database Tables**: Ensure your Supabase database has the required tables (`group_memberships`, `groups`, etc.)

## 📝 License

This is a private project owned by our team. All rights reserved.

## 👥 Team

- Team KOVARI
