# KOVARI - Technology Stack

This document provides a comprehensive list of all technologies, frameworks, libraries, and tools used in the KOVARI travel companion matching platform.

---

## 🎯 Core Framework & Runtime

- **Next.js 15.2.6** - React framework with App Router, Server Components, and API Routes
- **React 18.2.0** - UI library with hooks and component-based architecture
- **TypeScript 5** - Type-safe JavaScript with strict mode
- **Node.js** - JavaScript runtime environment

---

## 🎨 Frontend & UI Libraries

### UI Component Libraries
- **Radix UI** - Accessible, unstyled component primitives
  - `@radix-ui/react-avatar` - Avatar components
  - `@radix-ui/react-dialog` - Modal dialogs
  - `@radix-ui/react-dropdown-menu` - Dropdown menus
  - `@radix-ui/react-select` - Select components
  - `@radix-ui/react-tabs` - Tab navigation
  - `@radix-ui/react-toast` - Toast notifications
  - `@radix-ui/react-tooltip` - Tooltips
  - `@radix-ui/react-slider` - Range sliders
  - `@radix-ui/react-switch` - Toggle switches
  - `@radix-ui/react-popover` - Popover components
  - `@radix-ui/react-checkbox` - Checkbox inputs
  - `@radix-ui/react-label` - Form labels
  - `@radix-ui/react-separator` - Visual separators
  - `@radix-ui/react-slot` - Composition utilities
  - `@radix-ui/react-collapsible` - Collapsible sections
  - `@radix-ui/react-toggle-group` - Toggle button groups

- **HeroUI (NextUI) 2.7.11** - Modern React component library
- **Material-UI (MUI) 7.1.1** - React component library
- **Headless UI 2.2.4** - Unstyled, accessible UI components

### Styling & Design
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **tailwindcss-animate 1.0.7** - Animation utilities
- **tailwind-merge 3.3.0** - Merge Tailwind classes
- **tailwind-scrollbar-hide 4.0.0** - Hide scrollbar utilities
- **CSS Modules** - Component-scoped styling
- **PostCSS 8.4.35** - CSS processing
- **Autoprefixer 10.4.21** - CSS vendor prefixing

### Icons & Graphics
- **Lucide React 0.511.0** - Icon library
- **Heroicons 2.2.0** - SVG icon set
- **React Icons 5.5.0** - Popular icon libraries collection
- **Remix Icon 4.6.0** - Open source icon library
- **Iconify React 6.0.0** - Universal icon framework
- **Material Icons** - Material Design icons

### Animations & Interactions
- **Framer Motion 12.19.1** - Production-ready motion library
- **Motion 12.15.0** - Animation library
- **React Snowfall 2.4.0** - Snowfall animation effect
- **@dnd-kit/core 6.3.1** - Drag and drop functionality
- **@dnd-kit/modifiers 9.0.0** - Drag and drop modifiers
- **@dnd-kit/utilities 3.2.2** - Drag and drop utilities

### Data Visualization
- **Recharts 3.0.2** - Composable charting library
- **D3.js 7.9.0** - Data visualization library
- **d3-geo 3.1.1** - Geographic projections
- **React Calendar Heatmap 1.10.0** - GitHub-style calendar heatmap
- **Topojson Client 3.1.0** - TopoJSON utilities

---

## 🔐 Authentication & User Management

- **Clerk 6.24.0** - Complete authentication solution
  - `@clerk/nextjs` - Next.js integration
  - `@clerk/clerk-sdk-node` - Server-side SDK
  - `@clerk/themes` - Theming support
- **Supabase Auth Helpers** - Additional auth utilities
  - `@supabase/auth-helpers-nextjs` - Next.js auth helpers
  - `@supabase/ssr` - Server-side rendering support

---

## 💾 Database & Data Storage

### Primary Database
- **Supabase** - PostgreSQL database with real-time capabilities
  - `@supabase/supabase-js 2.49.9` - JavaScript client
  - `@supabase/ssr 0.6.1` - SSR support
  - `@supabase/auth-helpers-nextjs 0.10.0` - Auth helpers

### Caching & Session Storage
- **Redis 5.6.1** - In-memory data store for sessions and caching
- **Docker Compose** - Local Redis containerization

---

## 🗺️ Maps & Geocoding

- **Leaflet 1.9.4** - Open-source JavaScript library for interactive maps
- **React Leaflet 4.2.1** - React components for Leaflet
- **Leaflet Default Icon Compatibility 0.1.2** - Icon compatibility layer
- **OpenStreetMap Nominatim API** - Geocoding service for location search
- **Custom Geocoding Service** - Fallback coordinates for common destinations

---

## 📝 Forms & Validation

- **React Hook Form 7.57.0** - Performant forms with easy validation
- **Zod 3.25.63** - TypeScript-first schema validation
- **@hookform/resolvers 5.1.1** - Validation resolvers
- **React Day Picker 8.10.1** - Date picker component
- **React Image Crop 11.0.10** - Image cropping functionality

---

## 📤 File Upload & Media Management

- **UploadThing 7.7.2** - File upload service
  - `@uploadthing/react 7.3.1` - React components
- **Cloudinary 2.7.0** - Cloud-based image and video management
- **UUID 11.1.0** - Unique identifier generation

---

## 💬 Real-time Communication

- **Supabase Realtime** - Real-time subscriptions for:
  - Live chat messages
  - Group updates
  - User presence
  - Notification delivery

---

## 🔒 Security & Encryption

- **Crypto-JS 4.2.0** - Encryption library for end-to-end chat encryption
- **AES Encryption** - Advanced Encryption Standard for secure messaging
- **Clerk Security** - Built-in security features (JWT, session management)

---

## 📧 Email & Notifications

- **Resend 4.6.0** - Email delivery service
- **Nodemailer 7.0.3** - Email sending library
- **Sendinblue (SIB) API SDK 8.5.0** - Email marketing and transactional emails

---

## 🎭 State Management

- **Zustand 5.0.5** - Lightweight state management
- **React Context API** - Built-in React state management
- **SWR (via Clerk)** - Data fetching and caching

---

## 🧩 Utility Libraries

### Date & Time
- **date-fns 3.6.0** - Modern JavaScript date utility library

### Data Processing
- **CSV Parse 6.1.0** - CSV parsing library
- **Class Variance Authority 0.7.1** - Variant-based styling utilities
- **clsx 2.1.1** - Conditional className utility
- **CMDK 1.1.1** - Command menu component

### HTTP & API
- **Node Fetch 3.3.2** - HTTP request library

### Emoji Support
- **Emoji Mart 5.6.0** - Emoji picker
- **@emoji-mart/data 1.2.1** - Emoji data
- **@emoji-mart/react 1.1.1** - React emoji picker

### UI Utilities
- **Sonner 2.0.7** - Toast notification library
- **Next Themes 0.4.6** - Theme switching (dark/light mode)
- **React Loading Skeleton 3.5.0** - Loading placeholder components

---

## 📊 Monitoring & Error Tracking

- **Sentry 9.31.0** - Error tracking and performance monitoring
  - `@sentry/nextjs` - Next.js integration
  - Automatic source map upload
  - Performance monitoring
  - Error boundary integration

---

## 🧪 Development Tools

### Linting & Code Quality
- **ESLint 9.0.0** - JavaScript/TypeScript linter
- **ESLint Config Next 15.3.3** - Next.js ESLint configuration

### Type Definitions
- `@types/node 20` - Node.js type definitions
- `@types/react 19.1.8` - React type definitions
- `@types/react-dom 19.1.6` - React DOM type definitions
- `@types/leaflet 1.9.20` - Leaflet type definitions
- `@types/d3 7.4.3` - D3.js type definitions
- `@types/uuid 10.0.0` - UUID type definitions
- `@types/nodemailer 6.4.17` - Nodemailer type definitions
- `@types/topojson-client 3.1.5` - TopoJSON type definitions
- `@types/crypto-js 4.2.2` - Crypto-JS type definitions

### Build Tools
- **TypeScript 5** - Type checking and compilation
- **TSX 4.21.0** - TypeScript execution
- **Webpack** - Module bundler (via Next.js)
- **PostCSS** - CSS processing

### Environment Management
- **dotenv 17.2.1** - Environment variable management

---

## 🤖 AI/ML (Planned/Roadmap)

### Current Status
- **ML Dataset Generation** - Scripts for collecting training data
- **Feature Extraction** - Compatibility scoring features
- **Event Logging** - ML match event tracking system

### Planned Integrations
- **OpenAI API** - NLP, embeddings, content moderation
- **Hugging Face** - Open-source ML models
- **XGBoost/LightGBM** - Gradient boosting for matching algorithm
- **TensorFlow.js** - Client-side ML capabilities
- **scikit-learn** - Python ML library for custom models

---

## 🐳 DevOps & Infrastructure

### Containerization
- **Docker** - Container platform
- **Docker Compose 3.8** - Multi-container orchestration

### Deployment Platforms
- **Vercel** - Next.js hosting and deployment (recommended)
- **Render.com** - Redis hosting
- **Cloudinary** - Media CDN

### Version Control
- **Git** - Version control system
- **GitHub** - Code repository hosting

---

## 📱 Progressive Web App Features

- **Service Workers** - Offline support (via Next.js)
- **Responsive Design** - Mobile-first approach
- **Touch Gestures** - Mobile interaction support

---

## 🔧 API Integrations

### Third-Party Services
- **Clerk API** - Authentication and user management
- **Supabase API** - Database and real-time subscriptions
- **OpenStreetMap Nominatim API** - Geocoding
- **Cloudinary API** - Image/video processing
- **UploadThing API** - File upload handling
- **Resend API** - Email delivery
- **Sentry API** - Error reporting

---

## 📦 Package Management

- **npm** - Node package manager
- **package-lock.json** - Dependency locking

---

## 🎯 Key Features Implemented

### Matching Algorithm
- Rule-based compatibility scoring
- Solo travel matching
- Group travel matching
- Distance-based filtering
- Date overlap calculation
- Budget compatibility
- Interest similarity (Jaccard)
- Personality compatibility

### Real-time Features
- Live chat (direct and group)
- Real-time notifications
- Presence indicators
- Live updates

### Security Features
- End-to-end encryption (AES)
- JWT authentication
- Session management
- Secure file uploads
- Input validation and sanitization

---

## 📈 Performance Optimizations

- **Server Components** - Reduced client-side JavaScript
- **Image Optimization** - Next.js Image component
- **Code Splitting** - Automatic route-based splitting
- **Caching** - Redis for session and data caching
- **Lazy Loading** - Component and route lazy loading
- **Bundle Optimization** - Webpack optimizations

---

## 🌐 Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement approach

---

## 📚 Documentation & Standards

- **TypeScript** - Type safety and documentation
- **JSDoc** - Code documentation
- **Markdown** - Project documentation
- **ESLint** - Code style enforcement

---

## 🔄 Development Workflow

- **Hot Module Replacement (HMR)** - Fast development iteration
- **Fast Refresh** - React component hot reloading
- **TypeScript Compiler** - Real-time type checking
- **ESLint** - Real-time linting

---

*Last Updated: January 2025*
*Project: KOVARI - Travel Companion Matching Platform*
