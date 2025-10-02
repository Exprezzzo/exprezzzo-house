import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Placeholder - will connect to PostgreSQL later
  const vendors = [
    {
      id: '1',
      name: 'The Chandelier Bar',
      category: 'Nightlife',
      verified: true,
      description: 'Multi-story visual wonder in Cosmopolitan'
    },
    {
      id: '2',
      name: 'Caesars Palace',
      category: 'Dining',
      verified: true,
      description: 'World-class restaurants and entertainment'
    }
  ];

  return NextResponse.json({
    success: true,
    total: vendors.length,
    vendors
  });
}
