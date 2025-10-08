import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/transactions/[id] - Get a specific transaction
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const transactionId = parseInt(params.id);

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 });
    }

    // Fetch the specific transaction
    const transaction = await prisma.transaction.findFirst({
      where: { 
        id: transactionId,
        userId: user.id // Ensure user can only access their own transactions
      },
      include: {
        category: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, transaction }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/transactions/[id] - Update transaction status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const transactionId = parseInt(params.id);

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 });
    }

    const body = await req.json();
    const { isPaid } = body;

    // Validate that isPaid field is provided
    if (isPaid === undefined) {
      return NextResponse.json(
        { error: "isPaid field is required" },
        { status: 400 }
      );
    }

    // Validate isPaid is a boolean
    if (typeof isPaid !== 'boolean') {
      return NextResponse.json(
        { error: "isPaid must be a boolean value (true for paid/received, false for pending)" },
        { status: 400 }
      );
    }

    // Check if transaction exists and belongs to the user
    const existingTransaction = await prisma.transaction.findFirst({
      where: { 
        id: transactionId,
        userId: user.id
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        isPaid: isPaid
      } as any,
      include: {
        category: true,
      },
    });

    const statusMessage = isPaid 
      ? existingTransaction.type === 'income' 
        ? "Transaction marked as received" 
        : "Transaction marked as paid"
      : "Transaction marked as pending";

    return NextResponse.json(
      { 
        success: true, 
        message: statusMessage,
        transaction: updatedTransaction 
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error updating transaction status:", error);
    return NextResponse.json(
      { error: "Failed to update transaction status", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] - Delete a transaction
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const transactionId = parseInt(params.id);

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 });
    }

    // Check if transaction exists and belongs to the user
    const existingTransaction = await prisma.transaction.findFirst({
      where: { 
        id: transactionId,
        userId: user.id
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Transaction deleted successfully" 
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction", details: error.message },
      { status: 500 }
    );
  }
}
