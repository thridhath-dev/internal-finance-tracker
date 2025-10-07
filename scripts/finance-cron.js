/**
 * Windows Cron Job Script for Finance Reports
 * This script calls the finance API endpoint to send daily reports
 * 
 * Setup Instructions for Windows:
 * 1. Open Task Scheduler (taskschd.msc)
 * 2. Create Basic Task
 * 3. Name: "Daily Finance Report"
 * 4. Trigger: Daily at 9:00 AM
 * 5. Action: Start a program
 * 6. Program: node
 * 7. Arguments: scripts/finance-cron.js
 * 8. Start in: C:\Users\ThridhathG\Desktop\internal_finance
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_ENDPOINT = '/api/nodemailer';

/**
 * Make HTTP request to the finance API
 */
async function callFinanceAPI() {
  return new Promise((resolve, reject) => {
    const url = new URL(API_ENDPOINT, API_BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    // Send the request body
    const body = JSON.stringify({ action: 'send-report' });
    req.write(body);
    req.end();
  });
}

/**
 * Main function to run the finance report
 */
async function runFinanceReport() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Starting finance report cron job...`);
  
  try {
    const result = await callFinanceAPI();
    
    if (result.success) {
      console.log(`[${timestamp}] ✅ ${result.message}`);
      if (result.data) {
        console.log(`[${timestamp}] Report Summary:`, {
          dueExpenses: result.data.dueExpenses,
          unpaidTransactions: result.data.unpaidTransactions,
          overdueExpenses: result.data.overdueExpenses,
          categoryBreaches: result.data.categoryBreaches,
          hasRevenueAlert: result.data.hasRevenueAlert,
        });
      }
    } else {
      console.error(`[${timestamp}] ❌ ${result.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`[${timestamp}] ❌ Finance report failed:`, error.message);
    process.exit(1);
  }
}

/**
 * Test the API connection
 */
async function testConnection() {
  console.log('Testing API connection...');
  try {
    const result = await callFinanceAPI();
    console.log('Connection test result:', result);
  } catch (error) {
    console.error('Connection test failed:', error.message);
  }
}

/**
 * Test the API without sending email (dry run)
 */
async function testFinanceLogic() {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/nodemailer/test', API_BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.end();
  });
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--test')) {
  testConnection();
} else {
  runFinanceReport();
}

// Handle process signals for graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Exiting gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Exiting gracefully...');
  process.exit(0);
});
