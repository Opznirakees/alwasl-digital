import { ok } from '@/server/http';

export const runtime = 'nodejs';

export async function GET() {
  return ok({
    methods: [{ id: 'cash', enabled: true }],
  });
}
