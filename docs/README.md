# P2tEcostay Resort - Project Documentation

Welcome to the P2tEcostay Resort project documentation. This guide will help you understand the project structure, architecture, and how to work with it.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Folder Structure](#folder-structure)
3. [State Management](#state-management)
4. [Routing Logic](#routing-logic)
5. [Forms & Validations](#forms--validations)
6. [Authentication](#authentication)
7. [Deployment Notes](#deployment-notes)

---

## Project Overview

P2tEcostay Resort is a Next.js 16 application built with TypeScript, Tailwind CSS, and shadcn/ui components. It serves as both a public-facing website and an admin dashboard for managing resort content, bookings, users, and analytics.

### Key Technologies

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Email**: Nodemailer
- **Form Validation**: Zod + React Hook Form
- **Charts**: Recharts
- **Animations**: Framer Motion

### Project Structure

The project follows Next.js App Router conventions with route groups for organization:

- `(website)` - Public-facing website pages
- `(admin)` - Admin dashboard pages (protected)
- `(login)` - Login page layout

---

## Folder Structure

```
p2tecostay-resort/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Admin route group
│   │   └── admin/                # Admin pages
│   │       ├── dashboard/        # Analytics dashboard
│   │       ├── products/         # Product management
│   │       ├── services/         # Service management
│   │       ├── solutions/        # Solution management
│   │       ├── careers/          # Career postings
│   │       ├── quick-contacts/   # Quick contact submissions
│   │       ├── backups/          # Firestore backups management
│   │       └── ...               # Other admin pages
│   ├── (website)/                # Website route group
│   │   ├── page.tsx              # Homepage
│   │   ├── contact/              # Contact page
│   │   ├── careers/              # Careers listing
│   │   ├── products/             # Product pages
│   │   └── ...                   # Other website pages
│   ├── (login)/                  # Login route group
│   │   └── login/                # Login page
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin API endpoints
│   │   ├── contact/              # Contact form API
│   │   ├── quick-contact/        # Quick contact API
│   │   ├── backups/               # Backup management API
│   │   └── ...                   # Other API routes
│   ├── layout.tsx                # Root layout
│   └── providers.tsx             # Client providers
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   ├── ui/                       # shadcn/ui components
│   └── ...                       # Shared components
├── context/                      # React Context providers
│   ├── auth-context.tsx          # Authentication context
│   └── quick-contact-context.tsx # Quick contact state
├── lib/                          # Utility libraries
│   ├── firebase.ts               # Firebase configuration
│   ├── email.ts                  # Email utilities
│   ├── rate-limit.ts             # Rate limiting
│   └── utils.ts                  # General utilities
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
└── docs/                         # Documentation (this folder)
```

### Key Directories Explained

#### `app/`
Next.js App Router directory. Contains all routes, layouts, and API endpoints.

- **Route Groups** (`(admin)`, `(website)`, `(login)`): Organize routes without affecting URL structure
- **API Routes** (`app/api/`): Server-side API endpoints using Next.js Route Handlers
- **Layouts**: Shared layouts for route groups

#### `components/`
Reusable React components organized by purpose.

- `admin/`: Admin-specific components (dialogs, forms, tables)
- `ui/`: shadcn/ui base components (buttons, inputs, dialogs, etc.)
- Root level: Shared components (header, footer, navigation)

#### `context/`
React Context providers for global state management.

- `auth-context.tsx`: Authentication state and methods
- `quick-contact-context.tsx`: Quick contact button visibility state

#### `lib/`
Utility functions and configurations.

- `firebase.ts`: Firebase client initialization
- `email.ts`: Email sending utilities (Nodemailer)
- `rate-limit.ts`: API rate limiting helpers
- `utils.ts`: General utility functions (cn, etc.)

---

## State Management

The project uses React Context API for global state management and local state for component-specific data.

### Global State (Context)

#### Authentication Context (`context/auth-context.tsx`)

Manages user authentication state across the application.

**State:**
- `user`: Firebase user object
- `userData`: User document from Firestore (role, disabled status, etc.)
- `loading`: Authentication loading state

**Methods:**
- `signIn(email, password)`: Email/password login
- `signInWithGoogle()`: Google OAuth login
- `signOut()`: Logout user
- `changePassword(currentPassword, newPassword)`: Change user password
- `refreshUserData()`: Refresh user data from Firestore

**Usage:**
```tsx
import { useAuth } from "@/context/auth-context";

function MyComponent() {
  const { user, userData, signOut } = useAuth();
  // ...
}
```

#### Quick Contact Context (`context/quick-contact-context.tsx`)

Manages quick contact form submission state to control button visibility.

**State:**
- `isFormSubmitted`: Boolean indicating if form was submitted (persisted in localStorage)

**Methods:**
- `markFormSubmitted()`: Mark form as submitted (permanently hides button)

**Usage:**
```tsx
import { useQuickContact } from "@/context/quick-contact-context";

function MyComponent() {
  const { isFormSubmitted, markFormSubmitted } = useQuickContact();
  // ...
}
```

### Local State

Component-specific state is managed using React hooks (`useState`, `useEffect`). Examples:

- Form inputs
- Modal open/close states
- Loading states
- Filter/search states

---

## Routing Logic

Next.js App Router handles routing based on the file system structure.

### Route Groups

Route groups (`(admin)`, `(website)`, `(login)`) organize routes without affecting URLs:

- `(admin)/admin/dashboard` → `/admin/dashboard`
- `(website)/contact` → `/contact`
- `(login)/login` → `/login`

### Protected Routes

Admin routes are protected by middleware and layout-level authentication checks.

**Middleware** (`middleware.ts`):
- Checks authentication for `/admin/*` routes
- Redirects unauthenticated users to `/login`

**Layout Protection** (`app/(admin)/admin/layout.tsx`):
- Verifies user authentication
- Checks user role (admin/manager)
- Verifies user is not disabled
- Shows loading state during checks

### Dynamic Routes

Dynamic routes use square brackets:

- `app/products/[url]/[productUrl]/page.tsx` → `/products/:url/:productUrl`
- `app/api/admin/products/[id]/route.ts` → `/api/admin/products/:id`

### API Routes

API routes are in `app/api/` and use Route Handlers:

- `GET /api/products` - List products
- `POST /api/admin/products` - Create product (admin only)
- `PATCH /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product

---

## Forms & Validations

Forms use React Hook Form with Zod for validation.

### Form Structure

1. **Define Zod Schema:**
```tsx
import * as z from "zod";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10),
  price: z.number().positive(),
});
```

2. **Use React Hook Form:**
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm({
  resolver: zodResolver(productSchema),
});
```

3. **Handle Submission:**
```tsx
const onSubmit = async (data: ProductFormValues) => {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  // Handle response
};
```

### Validation Patterns

- **Required Fields**: Use `.min()` or `.nonempty()` on Zod schema
- **Email**: Use `.email()` validator
- **Numbers**: Use `.number()` with `.positive()`, `.min()`, `.max()`
- **Custom Validation**: Use `.refine()` for complex rules

### Error Handling

- Client-side: Display errors via `formState.errors`
- Server-side: Return validation errors from API routes
- Toast notifications: Use `sonner` for user feedback

---

## Authentication

Authentication is handled by Firebase Auth with Firestore for user data.

### Authentication Flow

1. **User Login:**
   - User enters email/password or clicks Google login
   - Firebase Auth authenticates user
   - System fetches user document from Firestore
   - Checks user role and disabled status
   - Redirects to admin dashboard if authorized

2. **Session Management:**
   - Firebase Auth maintains session
   - `onAuthStateChanged` listener updates context
   - Firestore `onSnapshot` keeps user data in sync

3. **Authorization:**
   - Admin routes require `admin` or `manager` role
   - Disabled users cannot access admin
   - Middleware and layout enforce protection

### User Roles

- **admin**: Full access to all admin features
- **manager**: Limited access (can be customized)

### Password Management

- Users can change password via Settings modal (`components/nav-user.tsx`)
- Requires current password for reauthentication
- Uses Firebase `updatePassword` API

### Security Features

- Rate limiting on API endpoints
- reCAPTCHA on public forms
- Server-side validation
- Role-based access control
- Disabled user accounts

---

## Deployment Notes

### Environment Variables

Required environment variables (`.env.local`):

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Email (Nodemailer)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
INFO_EMAIL=

# Site Configuration
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_COMPANY_NAME=
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_CONTACT_PHONE=

# reCAPTCHA (optional)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
```

### Build Process

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Firebase Setup

1. **Firebase Project:**
   - Create Firebase project
   - Enable Authentication (Email/Password, Google)
   - Create Firestore database
   - Set up Firebase Admin SDK service account

2. **Firestore Collections:**
   All data is stored in Firestore collections:
   - `users` - User documents with role and status
   - `products` - Product data
   - `productTypes` - Product type categories
   - `services` - Service data
   - `solutions` - Solution data
   - `solutionTypes` - Solution type categories
   - `industries` - Industry data
   - `clients` - Client data
   - `vendors` - Vendor data
   - `careers` - Career postings
   - `contactForms` - Contact form submissions
   - `quickContacts` - Quick contact submissions
   - `backups` - Firestore backup metadata

3. **Firebase Rules:**
   - See `firebase.rules.txt` for security rules
   - Admin operations require server-side authentication
   - Deploy rules to Firebase Console: `firebase deploy --only firestore:rules`

### Deployment Checklist

- [ ] Set all environment variables
- [ ] Configure Firebase project
- [ ] Set up Firestore security rules
- [ ] Configure email SMTP settings
- [ ] Set up reCAPTCHA (optional)
- [ ] Build and test production build
- [ ] Deploy to hosting platform (Vercel, Netlify, etc.)
- [ ] Verify all API endpoints work
- [ ] Test authentication flow
- [ ] Verify email sending works

### Common Issues

1. **Firebase Admin Not Initialized:**
   - Check environment variables
   - Verify service account credentials

2. **Email Not Sending:**
   - Check SMTP credentials
   - Verify port and host settings
   - Check spam folder

3. **Authentication Errors:**
   - Verify Firebase Auth is enabled
   - Check user document exists in Firestore
   - Verify user role is set correctly

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)

---

## Backup Management

The admin panel includes a comprehensive backup system for Firestore data.

### Features

- **Create Backup**: Download all Firestore collections as JSON and store in Cloudinary
- **List Backups**: View all backups with metadata (date, size, collections, document count)
- **Download Backup**: Download backup files locally
- **Restore Backup**: Restore Firestore data from a backup file (overwrites existing data)

### Backup API Routes

- `GET /api/admin/backups` - List all backups
- `POST /api/admin/backups` - Create a new backup
- `GET /api/admin/backups/[id]` - Download backup file
- `POST /api/admin/backups/[id]` - Restore backup
- `DELETE /api/admin/backups/[id]` - Delete backup

### Backup Process

1. **Creation**: 
   - Fetches all documents from configured collections
   - Converts to JSON format
   - Uploads to Cloudinary (raw file storage)
   - Saves metadata to Firestore `backups` collection

2. **Restore**:
   - Downloads backup file from Cloudinary
   - Parses JSON data
   - Restores documents to Firestore collections using batch writes
   - Records restore timestamp in backup metadata

### Collections Backed Up

- users, products, productTypes, services, solutions, solutionTypes
- industries, clients, vendors, careers
- contactForms, quickContacts

### Security

- Only admin users can access backup features
- Backup files stored securely in Cloudinary
- Restore operations require confirmation (destructive action)

---

**Last Updated**: 2025-01-27

