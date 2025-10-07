# How Users Are Stored in the Database 💾

## Overview

When a user signs in or signs up using Clerk, their data is **automatically** stored in your NeonDB database through webhooks. No manual intervention needed!

## 📊 Database Tables

Your database has three main tables:

### 1. **User** Table
Stores user authentication and profile information:
```prisma
model User {
  id           Int           // Auto-incrementing ID
  email        String        // User's email (unique)
  name         String?       // Full name
  imageUrl     String?       // Profile picture
  clerkUserId  String        // Clerk user ID (unique)
  createdAt    DateTime      // When created
  updatedAt    DateTime      // Last update
  transactions Transaction[] // User's transactions
}
```

### 2. **Category** Table
Stores transaction categories:
```prisma
model Category {
  id           Int           // Auto-incrementing ID
  name         String        // Category name (unique)
  description  String?       // Optional description
  icon         String?       // Optional emoji/icon
  color        String?       // Optional color code
  createdAt    DateTime
  updatedAt    DateTime
  transactions Transaction[] // Related transactions
}
```

### 3. **Transaction** Table
Stores user transactions:
```prisma
model Transaction {
  id          Int       // Auto-incrementing ID
  amount      Float     // Transaction amount
  description String?   // Optional description
  type        String    // "income" or "expense"
  date        DateTime  // Transaction date
  userId      Int       // Links to User
  categoryId  Int       // Links to Category
  createdAt   DateTime
  updatedAt   DateTime
}
```

## 🔄 Automatic User Storage Flow

### When User Signs Up:

```
1. User clicks "Get Started" on welcome page
        ↓
2. Clerk modal opens for sign up
        ↓
3. User enters credentials (email, Google, etc.)
        ↓
4. Clerk creates user account
        ↓
5. 🎯 Clerk sends webhook → POST /api/webhooks
        ↓
6. Your webhook receives: user.created event
        ↓
7. Webhook extracts user data:
   - id (Clerk user ID)
   - email_addresses[0].email_address
   - first_name
   - last_name
   - image_url
        ↓
8. ✅ Creates user in database:
   await prisma.user.create({
     data: {
       clerkUserId: id,
       email: email_addresses[0].email_address,
       name: "First Last",
       imageUrl: image_url,
     }
   })
        ↓
9. User is now in your database! 🎉
```

### When User Signs In (Existing User):

```
1. User clicks "Sign In" button
        ↓
2. Clerk authenticates user
        ↓
3. No webhook fired (user already exists)
        ↓
4. User can access your app
```

### When User Updates Profile:

```
1. User updates their profile in Clerk
        ↓
2. 🎯 Clerk sends webhook → POST /api/webhooks
        ↓
3. Webhook receives: user.updated event
        ↓
4. ✅ Updates user in database:
   await prisma.user.update({
     where: { clerkUserId: id },
     data: {
       email: new_email,
       name: new_name,
       imageUrl: new_image,
     }
   })
```

### When User Deletes Account:

```
1. User deletes their Clerk account
        ↓
2. 🎯 Clerk sends webhook → POST /api/webhooks
        ↓
3. Webhook receives: user.deleted event
        ↓
4. ✅ Deletes user from database:
   await prisma.user.delete({
     where: { clerkUserId: id }
   })
        ↓
5. All user's transactions also deleted (CASCADE)
```

## 🔍 What Data Is Stored?

From Clerk to your database:

| Clerk Field | Your Database Field | Description |
|-------------|---------------------|-------------|
| `id` | `clerkUserId` | Unique Clerk user ID |
| `email_addresses[0].email_address` | `email` | Primary email |
| `first_name` + `last_name` | `name` | Full name |
| `image_url` | `imageUrl` | Profile picture URL |
| Auto | `createdAt` | When created |
| Auto | `updatedAt` | Last updated |

## 🔐 Webhook Security

Your webhook at `/api/webhooks` is secured:

1. **Signature Verification**: Every request is verified using the `SIGNING_SECRET`
2. **Svix Headers Required**: Validates `svix-id`, `svix-timestamp`, `svix-signature`
3. **Invalid requests rejected**: Returns 400 if verification fails

## 📝 Webhook Events Handled

Your application handles these three events:

### ✅ user.created
- **When**: User signs up for the first time
- **Action**: Creates new user in database
- **Response**: 201 with user data

### ✅ user.updated
- **When**: User updates their profile
- **Action**: Updates existing user in database
- **Response**: 200 with updated user data

### ✅ user.deleted
- **When**: User deletes their account
- **Action**: Removes user from database
- **Response**: 200 with deleted user data

## 🧪 Testing the Flow

### Step 1: Start your app
```bash
npm run dev
```

### Step 2: Sign up a test user
1. Go to http://localhost:3000
2. Click "Get Started"
3. Sign up with email

### Step 3: Check the database
```bash
npx prisma studio
```

### Step 4: Verify in database
1. Open User table
2. You should see your user with:
   - ✅ Email address
   - ✅ Name
   - ✅ clerkUserId
   - ✅ imageUrl (if provided)
   - ✅ createdAt timestamp

### Step 5: Check server logs
You should see:
```
Received webhook with ID clu_xxx and event type of user.created
✅ User created in database: user@example.com
```

## 🐛 Troubleshooting

### User not appearing in database?

**Check 1: Webhook configured?**
```bash
# Go to Clerk Dashboard → Webhooks
# Verify endpoint exists: your-domain.com/api/webhooks
# Verify subscribed to: user.created, user.updated, user.deleted
```

**Check 2: Signing secret correct?**
```bash
# Check .env.local
SIGNING_SECRET=whsec_xxxxx  # Must match Clerk Dashboard
```

**Check 3: Check server logs**
```bash
npm run dev
# Look for webhook errors
```

**Check 4: Database connection**
```bash
npx prisma studio
# If this fails, your DATABASE_URL is incorrect
```

### Webhook returning errors?

**Error: "Missing Svix headers"**
- Webhook not coming from Clerk
- Check webhook URL in Clerk Dashboard

**Error: "Verification error"**
- SIGNING_SECRET doesn't match
- Copy correct secret from Clerk Dashboard

**Error: "Failed to create user"**
- Database connection issue
- User might already exist (duplicate email/clerkUserId)
- Check Prisma schema is up to date

## 🎯 Key Points

✅ **Automatic**: Users are stored automatically when they sign up
✅ **Synced**: Updates in Clerk sync to your database
✅ **Secure**: Webhook signatures are verified
✅ **Clean**: Deleted users are removed from database (with CASCADE)

## 📚 Related Files

- `src/app/api/webhooks/route.ts` - Webhook handler code
- `prisma/schema.prisma` - Database schema
- `.env.local` - Environment variables (DATABASE_URL, SIGNING_SECRET)

---

**You don't need to do anything!** Just make sure:
1. ✅ Clerk webhook is configured
2. ✅ SIGNING_SECRET is in .env.local
3. ✅ DATABASE_URL is correct
4. ✅ Ran `npx prisma db push`

Then users will automatically be stored when they sign up! 🚀

