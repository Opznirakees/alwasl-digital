export function assertCronRequest(request: Pick<Request, 'headers'>, env: NodeJS.ProcessEnv = process.env) {
  const secret = env.CRON_SECRET?.trim();
  if (!secret) throw new Error('CRON_SECRET_NOT_CONFIGURED');

  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const headerSecret = request.headers.get('x-cron-secret')?.trim();

  if (bearer !== secret && headerSecret !== secret) {
    throw new Error('FORBIDDEN');
  }
}
