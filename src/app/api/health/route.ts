import { getSystemHealth } from '@/server/services/monitoring';

export const runtime = 'nodejs';

export async function GET() {
  const health = await getSystemHealth();
  return Response.json(health, {
    status: health.status === 'down' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
