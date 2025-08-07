import { Interface } from "readline";
import axios from 'axios'

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

