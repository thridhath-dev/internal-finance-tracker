# 📧 Email Configuration Guide

## Current Status
❌ **No Automatic Email Alerts** - Emails are only sent manually

## How to Enable Automatic Email Alerts

### 1. Add Environment Variables
Add these to your `.env.local` file:

```env
# Automatic Email Alerts
AUTO_EMAIL_ALERTS=true
EMAIL_ALERT_FREQUENCY=daily
EMAIL_ALERT_TIME=09:00

# App URL (for internal API calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Scheduled Email Options

#### Option A: Daily Scheduled Emails
Run this script to send daily emails at 9:00 AM:

```bash
node scripts/send-daily-email.js
```

#### Option B: Real-time Alert Emails
With `AUTO_EMAIL_ALERTS=true`, emails will be sent automatically when:
- High priority upcoming due alerts
- Budget exceeded alerts  
- Revenue shortfall alerts

### 3. Test Automatic Emails

#### Test Real-time Alerts:
1. Set `AUTO_EMAIL_ALERTS=true` in environment
2. Visit `/dashboard/alerts` - this will trigger email if urgent alerts exist
3. Check console logs for email sending status

#### Test Scheduled Emails:
1. Run: `node scripts/send-daily-email.js`
2. Script will run daily at 9:00 AM
3. Check console logs for email status

### 4. Email Triggers

#### Automatic Email Sent When:
- ✅ **High Priority Due**: Bills due within 3 days
- ✅ **Budget Exceeded**: Any category over budget
- ✅ **Revenue Shortfall**: Income below 80% of goal
- ✅ **Daily Report**: Scheduled daily summary

#### Email Content Includes:
- 📊 Financial summary
- 🚨 Due expenses (next 3 days)
- 💳 Recent expenses (last 3 days)
- ⚠️ Unpaid transactions
- 📅 Overdue expenses
- 💰 Budget breaches
- 📈 Revenue status

### 5. Manual Email Testing

#### Test Mode (No Email):
```
GET /api/nodemailer?test=true
```

#### Send Actual Email:
```
POST /api/nodemailer
Body: {"action": "send-report"}
```

#### Test Page:
Visit `/test-email` for interactive testing

### 6. Monitoring

Check these logs for email status:
- ✅ "Email sent successfully"
- ❌ "Email sending failed"
- 📊 "Finance report sent with X alerts"

## Current Email Recipients
- **From**: thridhath@wigoh.ai
- **To**: gpthridhath@gmail.com
- **SMTP**: smtp.gmail.com:587
