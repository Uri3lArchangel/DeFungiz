import { NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/dbConnect';

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Convert address to lowercase for consistency
    // const lowercaseAddress = address.toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ walletAddress: address });

    if (existingUser) {
      return NextResponse.json(
        { success: true, data: existingUser, id: existingUser._id, message: 'User already exists' },
        { status: 200 }
      );
    }

    // Generate a username based on the wallet address
    const username = `user-${address.slice(2, 8)}`;

    // Create new user
    const newUser = await User.create({
      walletAddress: address,
      username: username,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, data: newUser, message: 'User created successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: address });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: user },
      { status: 200 }
    );

  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
