import { Interface } from "readline";
import axios from 'axios'
import User from '@/models/User';
//Create a function that queries the api to create user based on the wallet address

export const createUser = async (address: string): Promise<{success: boolean, data?: any, id?: string, message?: string, error?: string}> => {

    const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
        address: address
    })

    return res.data
}

// Function to query user by wallet address
export const getUser = async (address: string): Promise<{success: boolean, data?: any, error?: string}> => {
    try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user?address=${address}`);
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return { success: false, error: 'User not found' };
        }
        return { success: false, error: 'Failed to fetch user' };
    }
}

// Function to create or get user by wallet address
export const createOrGetUser = async (walletAddress: string) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
  
      if (!user) {
        // Generate a username based on the wallet address
        const username = `user-${walletAddress.slice(2, 8)}`;
  
        // Create new user
        user = await User.create({
          walletAddress: walletAddress.toLowerCase(),
          username: username,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
  
        console.log(`✅ Created new user: ${username} (${walletAddress})`);
      } else {
        console.log(`✅ Found existing user: ${user.username} (${walletAddress})`);
      }
  
      return user;
    } catch (error) {
      console.error('Error creating/getting user:', error);
      throw new Error('Failed to create or get user');
    }
  }

