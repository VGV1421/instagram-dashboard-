// Test endpoint - NO dependencies
export async function GET() {
  return Response.json({
    success: true,
    message: 'Vercel deployment working!',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return Response.json({
    success: true,
    message: 'POST endpoint working!',
    timestamp: new Date().toISOString()
  });
}
