interface CheckResult {
  name: string;
  detail: string;
}

const customerLegalName = process.env.OWNERSHIP_CUSTOMER_LEGAL_NAME?.trim();
const expectedDigitalOceanEmail = process.env.OWNERSHIP_EXPECTED_DIGITALOCEAN_ACCOUNT_EMAIL?.trim();
const digitalOceanAppId = process.env.DO_APP_ID?.trim();
const digitalOceanDatabaseClusterId = process.env.DO_DATABASE_CLUSTER_ID?.trim();
const expectedGitHubOwner = process.env.OWNERSHIP_EXPECTED_GITHUB_OWNER?.trim();
const customerDomain = process.env.OWNERSHIP_CUSTOMER_DOMAIN?.trim();
const expectedDomainTarget = process.env.OWNERSHIP_EXPECTED_DOMAIN_TARGET?.trim();

if (!customerLegalName) {
  console.error('OWNERSHIP_CUSTOMER_LEGAL_NAME is required for operational ownership verification.');
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
    throw new Error(stderr.trim() || `Command failed: ${args.join(' ')}`);
  }

  return stdout.trim();
}

function parseGitHubOwner(remote: string) {
  const sshMatch = remote.match(/github\.com[:/]([^/]+)\/[^/]+?(?:\.git)?$/i);
  return sshMatch?.[1];
}

const results: CheckResult[] = [];

if (expectedDigitalOceanEmail) {
  const output = await commandOutput(['doctl', 'account', 'get', '--format', 'Email', '--no-header']);
  const actualEmail = output.split(/\s+/)[0];
  if (actualEmail !== expectedDigitalOceanEmail) {
    throw new Error(`DigitalOcean account email mismatch. Expected ${expectedDigitalOceanEmail}, got ${actualEmail || 'empty output'}.`);
  }
  results.push({ name: 'DigitalOcean account', detail: actualEmail });
}

if (digitalOceanAppId) {
  await commandOutput(['doctl', 'apps', 'get', digitalOceanAppId]);
  results.push({ name: 'DigitalOcean app access', detail: digitalOceanAppId });
}

if (digitalOceanDatabaseClusterId) {
  await commandOutput(['doctl', 'databases', 'get', digitalOceanDatabaseClusterId]);
  results.push({ name: 'DigitalOcean database access', detail: digitalOceanDatabaseClusterId });
}

if (expectedGitHubOwner) {
  const remote = await commandOutput(['git', 'config', '--get', 'remote.origin.url']);
  const actualOwner = parseGitHubOwner(remote);
  if (actualOwner !== expectedGitHubOwner) {
    throw new Error(`GitHub remote owner mismatch. Expected ${expectedGitHubOwner}, got ${actualOwner || remote}.`);
  }
  results.push({ name: 'GitHub remote owner', detail: actualOwner });
}

if (customerDomain) {
  const dnsOutput = await commandOutput(['dig', '+short', customerDomain]);
  if (!dnsOutput) {
    throw new Error(`No DNS records returned for ${customerDomain}.`);
  }
  if (expectedDomainTarget && !dnsOutput.includes(expectedDomainTarget)) {
    throw new Error(`DNS target mismatch for ${customerDomain}. Expected output to contain ${expectedDomainTarget}, got ${dnsOutput}.`);
  }
  results.push({ name: 'Domain DNS visibility', detail: `${customerDomain} -> ${dnsOutput.replace(/\n/g, ', ')}` });
}

if (!results.length) {
  console.error('No machine-verifiable ownership checks were configured.');
  console.error('Set at least one of OWNERSHIP_EXPECTED_DIGITALOCEAN_ACCOUNT_EMAIL, DO_APP_ID, DO_DATABASE_CLUSTER_ID, OWNERSHIP_EXPECTED_GITHUB_OWNER, or OWNERSHIP_CUSTOMER_DOMAIN.');
  process.exit(1);
}

console.log(`Operational ownership checks for ${customerLegalName}:`);
for (const result of results) {
  console.log(`- ${result.name}: ${result.detail}`);
}
console.log('Machine-verifiable checks passed. Manual legal ownership and API-key custody attestations are still required.');

export {};
