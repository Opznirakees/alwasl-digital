const clusterId = process.env.DO_DATABASE_CLUSTER_ID?.trim();
const maxAgeHours = Number(process.env.BACKUP_MAX_AGE_HOURS ?? '30');

if (!clusterId) {
  console.error('DO_DATABASE_CLUSTER_ID is required to verify DigitalOcean managed database backups.');
  process.exit(1);
}

if (!Number.isFinite(maxAgeHours) || maxAgeHours <= 0) {
  console.error('BACKUP_MAX_AGE_HOURS must be a positive number.');
  process.exit(1);
}

async function commandOutput(args: string[]) {
  const child = Bun.spawn(args, {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);

  if (exitCode !== 0) {
    console.error(stderr.trim() || `Command failed: ${args.join(' ')}`);
    console.error('Install and authenticate doctl before running backup verification.');
    process.exit(exitCode);
  }

  return stdout.trim();
}

const cluster = await commandOutput(['doctl', 'databases', 'get', clusterId, '--format', 'ID,Name,Engine,Status', '--no-header']);
const backups = await commandOutput(['doctl', 'databases', 'backups', clusterId, '--format', 'Created', '--no-header']);
const backupDates = backups
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((value) => ({ value, date: new Date(value) }))
  .filter((backup) => Number.isFinite(backup.date.getTime()))
  .sort((a, b) => b.date.getTime() - a.date.getTime());

if (!backupDates.length) {
  console.error(`No parseable automated backups were returned for database cluster ${clusterId}.`);
  process.exit(1);
}

const latest = backupDates[0];
const ageHours = (Date.now() - latest.date.getTime()) / (60 * 60 * 1000);

console.log(`Database cluster: ${cluster}`);
console.log(`Latest backup: ${latest.value}`);
console.log(`Backup age: ${ageHours.toFixed(1)} hours`);

if (ageHours > maxAgeHours) {
  console.error(`Latest backup is older than ${maxAgeHours} hours.`);
  process.exit(1);
}

console.log('DigitalOcean managed database backups are visible and recent.');

export {};
