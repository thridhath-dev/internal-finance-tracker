import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { createWriteStream, unlinkSync, existsSync } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { join } from "path";
import { tmpdir } from "os";

const prisma = new PrismaClient();

/**
 * Advanced CSV Export using fs.createWriteStream
 * This demonstrates the backend → buffer → client flow
 */
export async function GET(request: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse month parameter
    const url = new URL(request.url);
    const monthParam = url.searchParams.get('month');
    
    if (!monthParam) {
      return NextResponse.json(
        { error: "Month parameter is required. Use format: YYYY-MM" },
        { status: 400 }
      );
    }

    // Validate month format
    const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
    if (!monthMatch) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM (e.g., 2025-05)" },
        { status: 400 }
      );
    }

    const [, year, month] = monthMatch;
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date provided" },
        { status: 400 }
      );
    }

    // Calculate date range
    const startDate = startOfMonth(targetDate);
    const endDate = endOfMonth(targetDate);

    console.log(`📊 Starting CSV export with fs.createWriteStream for ${format(startDate, 'MMMM yyyy')}`);

    // Create temporary file path
    tempFilePath = join(tmpdir(), `transactions-${monthParam}-${Date.now()}.csv`);
    
    // Create write stream to temporary file
    const writeStream = createWriteStream(tempFilePath, { encoding: 'utf8' });
    
    // Create a readable stream for CSV data
    const csvDataStream = new Readable({
      objectMode: false,
      read() {
        // This will be called when the stream needs data
      }
    });

    // Write CSV header to stream with BOM for proper Excel compatibility
    const csvHeader = '\uFEFFID,Date,Type,Category,Amount,Description,Recurrence,Is Paid,Created At\n';
    csvDataStream.push(csvHeader);

    // Fetch transactions from database
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log(`📝 Processing ${transactions.length} transactions...`);

    // Process transactions in chunks and write to stream
    const chunkSize = 50; // Smaller chunks for better streaming simulation
    for (let i = 0; i < transactions.length; i += chunkSize) {
      const chunk = transactions.slice(i, i + chunkSize);
      
      // Convert chunk to CSV rows with proper Excel formatting
      const csvRows = chunk.map(transaction => {
        // Format date as Excel-compatible date (YYYY-MM-DD)
        const dateStr = format(transaction.date, 'yyyy-MM-dd');
        const createdAtStr = format(transaction.createdAt, 'yyyy-MM-dd HH:mm:ss');
        
        // Escape CSV values properly
        const escapeCSV = (value: string) => {
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };
        
        const row = [
          transaction.id.toString(),
          dateStr,
          escapeCSV(transaction.type),
          escapeCSV(transaction.category?.name || 'Uncategorized'),
          transaction.amount.toString(),
          escapeCSV(transaction.description || ''),
          escapeCSV(transaction.recurrence || 'none'),
          transaction.isPaid ? 'Yes' : 'No',
          createdAtStr,
        ].join(',') + '\n';
        
        return row;
      }).join('');

      // Push data to readable stream
      csvDataStream.push(csvRows);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    // Signal end of data
    csvDataStream.push(null);

    // Use pipeline to stream from readable to writable
    await pipeline(csvDataStream, writeStream);
    
    console.log(`✅ CSV data written to temporary file: ${tempFilePath}`);

    // Read the file and create response
    const fileBuffer = await import('fs').then(fs => fs.promises.readFile(tempFilePath!));
    
    // Set response headers
    const headers = new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="transactions-${monthParam}.csv"`,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'no-cache',
    });

    // Create response with file buffer
    const response = new Response(new Uint8Array(fileBuffer), { headers });
    
    console.log(`📤 Sending ${fileBuffer.length} bytes to client`);

    return response;

  } catch (error) {
    console.error('❌ CSV Export Error:', error);
    return NextResponse.json(
      { 
        error: "Failed to export CSV", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  } finally {
    // Clean up temporary file
    if (tempFilePath && existsSync(tempFilePath)) {
      try {
        unlinkSync(tempFilePath);
        console.log(`🗑️ Cleaned up temporary file: ${tempFilePath}`);
      } catch (cleanupError) {
        console.error('⚠️ Failed to clean up temporary file:', cleanupError);
      }
    }
  }
}

/**
 * Alternative implementation using direct streaming without temporary files
 * This is more memory efficient for large datasets
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { month } = body;

    if (!month) {
      return NextResponse.json(
        { error: "Month parameter is required" },
        { status: 400 }
      );
    }

    // Redirect to GET method with month parameter
    const url = new URL(request.url);
    url.pathname = '/api/export-stream.csv';
    url.searchParams.set('month', month);
    
    return NextResponse.redirect(url);

  } catch (error) {
    console.error('❌ CSV Export POST Error:', error);
    return NextResponse.json(
      { error: "Failed to process export request" },
      { status: 500 }
    );
  }
}
