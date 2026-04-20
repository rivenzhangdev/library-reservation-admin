#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

function readConfig() {
  try {
    const cfgPath = path.resolve(__dirname, '..', '..', 'backend-envs.json');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cfg = require(cfgPath);
    return (cfg && cfg.BACKEND_ENVS) || null;
  } catch (e) {
    return null;
  }
}

function writeDotEnv(found) {
  try {
    const outPath = path.resolve(__dirname, '..', '.env');
    const content = `BACKEND_ENV=${found.key}\nBACKEND_BASE_URL=${
      found.baseUrl || ''
    }\nBACKEND_URL=${found.baseUrl || ''}\nBACKEND_LAN_URL=${
      found.lanBaseUrl || ''
    }\n`;
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`Wrote ${outPath}`);
  } catch (e) {
    console.error('Failed to write .env:', e.message);
    process.exit(1);
  }
}

function startDev() {
  const dev = spawn('pnpm', ['dev'], { stdio: 'inherit', shell: true });
  dev.on('close', (code) => process.exit(code));
}

const envs = readConfig() || [
  {
    key: 'development',
    label: 'Development',
    baseUrl: 'http://localhost:3000',
    lanBaseUrl: '',
  },
  {
    key: 'test',
    label: 'Test',
    baseUrl: 'http://localhost:3001',
    lanBaseUrl: '',
  },
  {
    key: 'uat',
    label: 'UAT',
    baseUrl: 'http://localhost:3002',
    lanBaseUrl: '',
  },
  {
    key: 'production',
    label: 'Production',
    baseUrl: 'http://localhost:3000',
    lanBaseUrl: '',
  },
];

const alias = {
  dev: 'development',
  test: 'test',
  uat: 'uat',
  prod: 'production',
  development: 'development',
  production: 'production',
};

const args = process.argv.slice(2);
const haveStartFlag = args.includes('--start') || args.includes('-s');
const envArg = args.find((a) => !a.startsWith('-'));

if (envArg) {
  const mapped = alias[envArg] || envArg;
  const found = envs.find((e) => e.key === mapped);
  if (!found) {
    console.error(`Invalid environment: ${envArg}`);
    process.exit(1);
  }
  writeDotEnv(found);
  if (haveStartFlag) startDev();
  else process.exit(0);
} else {
  // interactive selection: prefer raw-mode arrow selection if running in a TTY,
  // otherwise fall back to a simple numbered prompt so the script works when
  // run from non-interactive environments (editors, CI, or wrapped shells).
  if (process.stdin.isTTY && process.stdout.isTTY) {
    // interactive up/down selection, select to switch and start (like server script)
    let cursor = 0;
    function buildLines(cursor) {
      const lines = [];
      lines.push('请选择环境：Use ↑/↓ 选择，Enter 确认并启动，q/Ctrl+C 退出');
      envs.forEach((e, i) => {
        const pointer = i === cursor ? '>' : ' ';
        const lanInfo = e.lanBaseUrl ? ` (lan: ${e.lanBaseUrl})` : '';
        lines.push(
          `${pointer} ${e.label} [${e.key}]  base: ${e.baseUrl}${lanInfo}`,
        );
      });
      return lines;
    }

    const initial = buildLines(cursor);
    initial.forEach((l) => console.log(l));
    const total = initial.length;

    function redraw() {
      try {
        readline.moveCursor(process.stdout, 0, -total);
        const lines = buildLines(cursor);
        for (let i = 0; i < lines.length; i += 1) {
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
          process.stdout.write(lines[i]);
          if (i < lines.length - 1) process.stdout.write('\n');
        }
      } catch (e) {
        const lines = buildLines(cursor);
        lines.forEach((l) => console.log(l));
      }
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    function onData(key) {
      const buf = Buffer.from(key);
      if (buf.length === 1 && buf[0] === 3) {
        process.stdin.setRawMode(false);
        process.exit(0);
      }
      if (buf.length === 1 && (buf[0] === 113 || buf[0] === 81)) {
        process.stdin.setRawMode(false);
        process.exit(0);
      }
      if (buf.length === 1 && buf[0] === 13) {
        const chosen = envs[cursor];
        process.stdin.setRawMode(false);
        process.stdin.pause();
        writeDotEnv(chosen);
        // start dev after switch (server-style)
        startDev();
        return;
      }
      if (buf.length >= 3 && buf[0] === 27 && buf[1] === 91) {
        const code = buf[2];
        if (code === 65) {
          cursor = (cursor - 1 + envs.length) % envs.length;
          redraw();
          return;
        }
        if (code === 66) {
          cursor = (cursor + 1) % envs.length;
          redraw();
          return;
        }
      }
    }

    process.stdin.on('data', onData);
  } else {
    // Non-TTY fallback: print numbered list and ask for selection via readline.question
    console.log(
      'No interactive TTY detected - falling back to numbered selection',
    );
    envs.forEach((e, i) => {
      const lanInfo = e.lanBaseUrl ? ` (lan: ${e.lanBaseUrl})` : '';
      console.log(
        `${i + 1}) ${e.label} [${e.key}]  base: ${e.baseUrl}${lanInfo}`,
      );
    });
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(
      `Select environment (1-${envs.length}, Enter=1): `,
      (answer) => {
        let idx = 0;
        if (answer && answer.trim()) {
          const n = Number(answer.trim());
          if (!Number.isNaN(n) && n >= 1 && n <= envs.length) idx = n - 1;
        }
        const chosen = envs[idx];
        rl.close();
        writeDotEnv(chosen);
        // start dev after switch
        startDev();
      },
    );
  }
}
