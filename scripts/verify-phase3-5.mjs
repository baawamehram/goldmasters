import { spawn } from 'node:child_process';

const rootDir = 'C:/Users/user/Desktop/wishmasters';
const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const server = spawn(pnpmCmd, ['--filter', 'api', 'dev'], {
  cwd: rootDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: process.platform === 'win32',
});

const waitForServer = new Promise((resolve, reject) => {
  let resolved = false;

  server.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);

    if (!resolved && text.includes('Server running on port 4000')) {
      resolved = true;
      resolve(null);
    }
  });

  server.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  server.on('exit', (code) => {
    if (!resolved) {
      reject(new Error(`API server exited early (code ${code ?? 'unknown'})`));
    }
  });
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureOk = async (response) => {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText} — ${body}`);
  }
  return response;
};

try {
  await waitForServer;
  await wait(500);

  const baseUrl = 'http://localhost:4000/api/v1';

  const loginResponse = await ensureOk(
    await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'wish-admin', password: 'admin123' }),
    })
  );

  const loginJson = await loginResponse.json();
  const token = loginJson?.data?.token;

  if (!token) {
    throw new Error('Login response did not include an admin token');
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const finalResultPayload = { finalJudgeX: 0.44, finalJudgeY: 0.37 };
  await ensureOk(
    await fetch(`${baseUrl}/admin/competitions/test-id/final-result`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(finalResultPayload),
    })
  );

  const computeResponse = await ensureOk(
    await fetch(`${baseUrl}/admin/competitions/test-id/compute-winner`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  );

  const computeJson = await computeResponse.json();
  const winners = computeJson?.data?.winners ?? [];

  console.log(`\nWinner count returned: ${winners.length}`);
  winners.slice(0, 3).forEach((winner, index) => {
    console.log(
      ` #${index + 1} ticket ${winner.ticketNumber} (${winner.participantName}) — distance ${winner.distance}`
    );
  });

  const exportResponse = await ensureOk(
    await fetch(`${baseUrl}/admin/competitions/test-id/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );

  const csvText = await exportResponse.text();
  const csvLines = csvText.split('\n').slice(0, 6);

  console.log('\nCSV preview (first lines):');
  csvLines.forEach((line) => console.log(line));
} catch (error) {
  console.error('\nVerification failed:', error);
  process.exitCode = 1;
} finally {
  server.kill('SIGINT');
  await wait(500);
  server.kill('SIGTERM');
}
