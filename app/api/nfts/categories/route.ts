// app/api/nfts/categories/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const categories = [
    { id: 'all', name: 'All NFTs', count: 0 },
    { id: 'art', name: 'Art', count: 0 },
    { id: 'collectibles', name: 'Collectibles', count: 0 },
    { id: 'gaming', name: 'Gaming', count: 0 },
    { id: 'utility', name: 'Utility', count: 0 },
    { id: 'dynamic', name: 'Dynamic NFTs', count: 0 },
    { id: 'programmable', name: 'Programmable NFTs', count: 0 },
  ];

  return NextResponse.json(categories);
}