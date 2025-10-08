import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { Readable } from "stream";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    // Parse month parameter from URL
    const url = new URL(request.url);
    const monthParam = url.searchParams.get('month');
    
    if (!monthParam) {
      return NextResponse.json(
        { error: "Month parameter is required. Use format: YYYY-MM" },
        { status: 400 }
      );
    }

    // Validate and parse month parameter (format: YYYY-MM)
    const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
    if (!monthMatch) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM (e.g., 2025-05)" },
        { status: 400 }
      );
    }

    const [, year, month] = monthMatch;
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    // Validate date
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date provided" },
        { status: 400 }
      );
    }

    // Calculate date range for the month
    const startDate = startOfMonth(targetDate);
    const endDate = endOfMonth(targetDate);

    console.log(`📊 Exporting transactions for ${format(startDate, 'MMMM yyyy')}`);

    // Create a readable stream for CSV data
    const csvStream = new Readable({
      objectMode: false,
      read() {
        // This will be called by the stream when it needs data
      }
    });

    // Set response headers for CSV download
    const headers = new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="transactions-${monthParam}.csv"`,
      'Cache-Control': 'no-cache',
    });

    // Create the response with streaming
    const response = new Response(
      new ReadableStream({
        async start(controller) {
          try {
            // Write CSV header with BOM for proper Excel compatibility
            const csvHeader = '\uFEFFID,Date,Type,Category,Amount,Description,Recurrence,Is Paid,Created At\n';
            controller.enqueue(new TextEncoder().encode(csvHeader));

            // Stream transactions from database
            const transactionStream = await prisma.transaction.findMany({
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

            // Process transactions in chunks to simulate streaming
            const chunkSize = 100;
            for (let i = 0; i < transactionStream.length; i += chunkSize) {
              const chunk = transactionStream.slice(i, i + chunkSize);
              
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

              // Send chunk to client
              controller.enqueue(new TextEncoder().encode(csvRows));
              
              // Small delay to simulate streaming (remove in production)
              await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Close the stream
            controller.close();
            
            console.log(`✅ Successfully exported ${transactionStream.length} transactions for ${format(startDate, 'MMMM yyyy')}`);
            
          } catch (error) {
            console.error('❌ Error during CSV export:', error);
            controller.error(error);
          }
        },
      }),
      { headers }
    );

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
  }
}

// Alternative implementation using fs.createWriteStream (for reference)
// This would be used if you wanted to write to a temporary file first
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

    // This would implement the fs.createWriteStream approach
    // For now, redirect to GET method
    return NextResponse.redirect(
      new URL(`/api/export.csv?month=${month}`, request.url)
    );

  } catch (error) {
    console.error('❌ CSV Export POST Error:', error);
    return NextResponse.json(
      { error: "Failed to process export request" },
      { status: 500 }
    );
  }
}
