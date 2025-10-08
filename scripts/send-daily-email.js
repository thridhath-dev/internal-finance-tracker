const cron = require('node-cron');
const fetch = require('node-fetch');

// Run every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily finance email report...');
  
  try {
    const response = await fetch('http://localhost:3000/api/nodemailer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send-report' })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Daily email sent successfully:', result.message);
    } else {
      console.error('❌ Failed to send daily email:', result.message);
    }
  } catch (error) {
    console.error('❌ Error sending daily email:', error.message);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata" // Adjust to your timezone
});

console.log('📧 Daily email scheduler started - will run at 9:00 AM daily');
