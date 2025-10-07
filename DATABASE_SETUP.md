# Database Setup Guide 🗄️

Complete guide to set up your NeonDB database with User, Category, and Transaction tables.

## 📊 Database Structure

Your application uses three related tables:

```
User (Authentication & Profile)
  ↓
  └─→ Transaction (Financial Records)
        ↓
        └─→ Category (Transaction Categories)
```

## 🚀 Quick Setup

### Step 1: Get Your NeonDB Connection String

1. Go to [NeonDB Console](https://console.neon.tech)
2. Sign in or create an account
3. Create a new project (or select existing)
4. Go to **Dashboard** → **Connection Details**
5. Copy the connection string:
   ```
   postgresql://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### Step 2: Add to Environment Variables

Create/update `.env.local`:
```env
DATABASE_URL="postgresql://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require"
```

### Step 3: Generate Prisma Client & Create Tables

```bash
# Generate Prisma Client (creates type-safe database client)
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push
```

This creates three tables in your NeonDB database:
- ✅ **User** - Stores user accounts from Clerk
- ✅ **Category** - Stores transaction categories
- ✅ **Transaction** - Stores user transactions

### Step 4: Verify Tables Created

```bash
# Open Prisma Studio (GUI for your database)
npx prisma studio
```

Opens at `http://localhost:5555`

You should see three empty tables:
- User
- Category
- Transaction

## 📋 Table Details

### User Table

Automatically populated when users sign up via Clerk:

| Column | Type | Description |
|--------|------|-------------|
| `id` | Int | Primary key (auto-increment) |
| `email` | String | User email (unique) |
| `name` | String? | Full name (optional) |
| `imageUrl` | String? | Profile picture URL |
| `clerkUserId` | String | Clerk user ID (unique) |
| `createdAt` | DateTime | Account creation date |
| `updatedAt` | DateTime | Last update |

**Relationships:**
- Has many `Transaction` records

### Category Table

Manually created categories for organizing transactions:

| Column | Type | Description |
|--------|------|-------------|
| `id` | Int | Primary key (auto-increment) |
| `name` | String | Category name (unique) |
| `description` | String? | Optional description |
| `icon` | String? | Optional emoji/icon |
| `color` | String? | Optional color code |
| `createdAt` | DateTime | Creation date |
| `updatedAt` | DateTime | Last update |

**Relationships:**
- Has many `Transaction` records

**Example categories you might add:**
- 🍔 Food & Dining
- 🚗 Transportation
- 🏠 Housing
- 💼 Income
- 🎮 Entertainment
- 🛒 Shopping
- 💊 Healthcare
- 📚 Education
- 💰 Savings

### Transaction Table

Stores user financial transactions:

| Column | Type | Description |
|--------|------|-------------|
| `id` | Int | Primary key (auto-increment) |
| `amount` | Float | Transaction amount |
| `description` | String? | Optional note/description |
| `type` | String | "income" or "expense" |
| `date` | DateTime | Transaction date |
| `userId` | Int | Foreign key → User |
| `categoryId` | Int | Foreign key → Category |
| `createdAt` | DateTime | Record creation date |
| `updatedAt` | DateTime | Last update |

**Relationships:**
- Belongs to one `User`
- Belongs to one `Category`

**Important:** When a user is deleted, all their transactions are automatically deleted (CASCADE)

## 🔧 Schema File

Your complete schema (`prisma/schema.prisma`):

```prisma
model User {
  id           Int           @id @default(autoincrement())
  email        String        @unique
  name         String?
  imageUrl     String?
  clerkUserId  String        @unique
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  transactions Transaction[]
}

model Category {
  id           Int           @id @default(autoincrement())
  name         String        @unique
  description  String?
  icon         String?
  color        String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  transactions Transaction[]
}

model Transaction {
  id          Int      @id @default(autoincrement())
  amount      Float
  description String?
  type        String
  date        DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      Int
  
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  Int
}
```

## 🛠️ Common Commands

### View Database GUI
```bash
npx prisma studio
```

### Regenerate Prisma Client (after schema changes)
```bash
npx prisma generate
```

### Push Schema Changes to Database
```bash
npx prisma db push
```

### Reset Database (⚠️ Deletes all data!)
```bash
npx prisma db push --force-reset
```

### Format Schema File
```bash
npx prisma format
```

## 🧪 Testing Your Database

### 1. Create a test category using Prisma Studio:

```bash
npx prisma studio
```

1. Open Category table
2. Click "Add record"
3. Fill in:
   - name: "Food"
   - icon: "🍔"
   - color: "#FF6B6B"
4. Save

### 2. Sign up a test user:

1. Go to `http://localhost:3000`
2. Click "Get Started"
3. Sign up with email
4. Check User table in Prisma Studio
5. Your user should appear automatically! ✅

### 3. Check the relationship:

- Each Transaction must have a `userId` (which user made it)
- Each Transaction must have a `categoryId` (what category it belongs to)

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**Solution:**
- Check DATABASE_URL in `.env.local`
- Verify NeonDB project is active (free tier pauses after inactivity)
- Try reconnecting in NeonDB console

### Error: "Table does not exist"

**Solution:**
```bash
npx prisma db push
```

### Error: "Prisma Client not generated"

**Solution:**
```bash
npx prisma generate
```

### Changes to schema not reflecting?

**Solution:**
```bash
# 1. Update schema.prisma
# 2. Regenerate client
npx prisma generate
# 3. Push to database
npx prisma db push
```

### Want to start fresh?

```bash
# ⚠️ WARNING: Deletes all data!
npx prisma db push --force-reset
```

## 📊 Checking User Storage

After a user signs up:

1. **Check server logs:**
   ```
   ✅ User created in database: user@example.com
   ```

2. **Check Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   - Open User table
   - Should see the new user

3. **Check in code:**
   ```typescript
   import prisma from '@/lib/db'
   
   const users = await prisma.user.findMany()
   console.log(users) // Shows all users
   ```

## 🔐 Important Notes

1. **Never commit `.env.local`** - It's in `.gitignore` by default
2. **DATABASE_URL contains password** - Keep it secret
3. **NeonDB free tier limits:**
   - Pauses after 5 minutes of inactivity
   - Auto-resumes on first query (may take 1-2 seconds)
4. **User table auto-populated** - Via Clerk webhooks
5. **Category table manual** - You need to create categories
6. **Transaction table manual** - Created by your app logic

## 📚 Next Steps

After database setup:
1. ✅ Configure Clerk webhooks (see SETUP_GUIDE.md)
2. ✅ Add some categories (via Prisma Studio or your app)
3. ✅ Test user sign up
4. ✅ Build features to create transactions

---

Your database is ready! Users will automatically be stored when they sign up through Clerk. 🎉

