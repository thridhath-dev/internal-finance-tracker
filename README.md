# FinanceTracker - Next.js with Clerk Authentication & NeonDB

A modern finance tracking application built with Next.js 15, featuring Clerk authentication, automatic user synchronization to NeonDB via webhooks, and a beautiful dashboard for managing your finances.

## ✨ Features

- 🎨 **Stylish Welcome Page** with animated gradients
- 🔐 **Clerk Authentication** - Sign in/up with email, Google, and more
- 💾 **NeonDB Integration** - PostgreSQL database with Prisma ORM
- 🔄 **Automatic User Sync** - Webhooks keep your database in sync with Clerk
- 📊 **Dashboard with Sidebar** - Beautiful dashboard with financial overview
- 💰 **Transaction Tracking** - View income, expenses, and balance
- 🏷️ **Category System** - Organize transactions by categories
- 🌓 **Dark Mode Support** - Beautiful UI in both light and dark themes
- 📱 **Fully Responsive** - Works perfectly on mobile, tablet, and desktop
- ⚡ **Next.js 15** - Built with the latest React and Next.js features

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file with your credentials. See [ENV_VARIABLES.md](./ENV_VARIABLES.md) for details.

### 3. Set Up Database
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

This creates your database tables and populates 14 categories.

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## 📚 Documentation

- **[TRANSACTION_GUIDE.md](./TRANSACTION_GUIDE.md)** - How to add and manage transactions
- **[DASHBOARD_GUIDE.md](./DASHBOARD_GUIDE.md)** - Dashboard features and navigation guide
- **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)** - Complete explanation of how user storage works
- **[USER_STORAGE_FLOW.md](./USER_STORAGE_FLOW.md)** - Detailed webhook flow and events
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Database structure and setup guide

## 📊 Database Tables

Your application uses three related tables:

- **User** - Automatically populated from Clerk when users sign up
- **Category** - Transaction categories (e.g., Food, Transport, Income)
- **Transaction** - User financial transactions linked to users and categories

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for complete schema details.

## 🔄 Webhook Events

The application automatically syncs user data from Clerk to your NeonDB database:

- **user.created** → Creates user in database when they sign up
- **user.updated** → Updates user data when they modify their profile
- **user.deleted** → Removes user from database when they delete their account

Webhook endpoint: `/api/webhooks`

**Important:** Users are stored automatically! See [USER_STORAGE_FLOW.md](./USER_STORAGE_FLOW.md) for details.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 with App Router
- **Authentication:** Clerk
- **Database:** NeonDB (PostgreSQL)
- **ORM:** Prisma
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## 📖 Tutorial

For a complete tutorial on how to create this project, you can watch the video [here](https://youtu.be/T2vkt-zkUD4).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is open source and available under the MIT License.
