#!/usr/bin/env node
/* eslint-disable */
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
const util = require('util');
const execp = util.promisify(require('child_process').exec);
let inquirer = require('inquirer');
if (inquirer && inquirer.default) inquirer = inquirer.default;
let chalk = require('chalk');
if (chalk && chalk.default) chalk = chalk.default;

// read backend envs from workspace shared config
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

function spawnDev(envKey, baseUrl, lanUrl) {
  const env = Object.assign({}, process.env, {
    BACKEND_ENV: envKey,
    BACKEND_BASE_URL: baseUrl || '',
    BACKEND_URL: baseUrl || '',
    BACKEND_LAN_URL: lanUrl || '',
  });
  const child = spawn('pnpm', ['run', 'dev'], {
    stdio: 'inherit',
    env,
    shell: true,
  });
  child.on('exit', (code) => process.exit(code));
}

function parsePortFromBaseUrl(urlStr) {
  try {
    if (!urlStr) return null;
    const u = new URL(urlStr);
    if (u.port) return parseInt(u.port, 10);
    if (u.protocol === 'http:') return 80;
    if (u.protocol === 'https:') return 443;
    return null;
  } catch (e) {
    return null;
  }
}

function isPortInUse(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    socket.setTimeout(500);
    socket.once('connect', () => {
      resolved = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.once('error', () => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    });
    socket.connect(port, host || '127.0.0.1');
  });
}

async function getPidsByPort(port) {
  const pids = new Set();
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execp(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pidStr = parts[parts.length - 1];
        const pid = parseInt(pidStr, 10);
        if (!Number.isNaN(pid)) pids.add(pid);
      });
    } else {
      const { stdout } = await execp(`lsof -ti tcp:${port} || true`);
      const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
      lines.forEach((l) => {
        const pid = parseInt(l.trim(), 10);
        if (!Number.isNaN(pid)) pids.add(pid);
      });
    }
  } catch (e) {
    // ignore
  }
  return Array.from(pids);
}

async function killPids(pids) {
  if (!pids || pids.length === 0) return { success: false };
  try {
    if (process.platform === 'win32') {
      for (const pid of pids) {
        try {
          await execp(`taskkill /PID ${pid} /F`);
        } catch (e) {
          // ignore per-pid failure
        }
      }
    } else {
      try {
        await execp(`kill -9 ${pids.join(' ')}`);
      } catch (e) {
        // ignore
      }
    }
    return { success: true };
  } catch (e) {
    return { success: false, message: String(e) };
  }
}

async function interactiveSelect(arg) {
  const envs = readConfig() || [
    {
      key: 'development',
      label: 'Development',
      baseUrl: 'http://localhost:3000',
    },
    { key: 'test', label: 'Test', baseUrl: 'http://localhost:3001' },
    { key: 'uat', label: 'UAT', baseUrl: 'http://localhost:3002' },
    {
      key: 'production',
      label: 'Production',
      baseUrl: 'http://localhost:3000',
    },
  ];

  // normalize arg to key if provided
  const alias = {
    dev: 'development',
    test: 'test',
    uat: 'uat',
    prod: 'production',
  };
  const mappedArg = arg ? alias[arg] || arg : null;

  if (mappedArg) {
    const found = envs.find((e) => e.key === mappedArg);
    if (found) {
      const base = found.baseUrl || process.env.BACKEND_BASE_URL || '';
      const lan = found.lanBaseUrl || '';
      spawnDev(found.key, base, lan);
      return;
    }
  }

  // If TTY available, use inquirer for a pleasant interactive experience
  if (process.stdin.isTTY && process.stdout.isTTY) {
    const choices = envs.map((e) => ({
      name: `${e.label} [${e.key}]  base: ${e.baseUrl}${
        e.lanBaseUrl ? ` (lan: ${e.lanBaseUrl})` : ''
      }`,
      value: e,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'env',
        message: '请选择要启动的环境：',
        choices,
        pageSize: 10,
      },
    ]);

    if (!answers || !answers.env) {
      console.log(chalk.yellow('已取消操作。'));
      process.exit(0);
    }

    let chosen = answers.env;

    // 端口检测 — 如果 baseUrl 可解析出端口，检查端口占用并提供提示
    const parsedPort = parsePortFromBaseUrl(chosen.baseUrl);
    if (parsedPort) {
      const host = (() => {
        try {
          return new URL(chosen.baseUrl).hostname || '127.0.0.1';
        } catch (e) {
          return '127.0.0.1';
        }
      })();

      if (await isPortInUse(host, parsedPort)) {
        console.log(
          chalk.green(
            `检测到 ${host}:${parsedPort} 端口已被占用，后台服务似乎已启动，继续使用当前环境。`,
          ),
        );
      } else {
        console.log(
          chalk.yellow(
            `检测到 ${host}:${parsedPort} 端口未占用，后台服务可能尚未启动，请确认后端是否已运行。`,
          ),
        );
      }
    }

    console.log(chalk.cyan(`正在使用 ${chosen.key} 环境访问后台服务...`));
    spawnDev(
      chosen.key,
      chosen.baseUrl || process.env.BACKEND_BASE_URL || '',
      chosen.lanBaseUrl || '',
    );
    return;
  }

  // Non-TTY fallback: simple numeric prompt
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('请选择要使用的环境（输入编号并回车）：');
  envs.forEach((e, i) => {
    console.log(`  ${i + 1}) ${e.label} [${e.key}]  base: ${e.baseUrl}`);
  });

  rl.question('编号: ', (answer) => {
    rl.close();
    const idx = Number(answer.trim()) - 1;
    if (Number.isNaN(idx) || idx < 0 || idx >= envs.length) {
      console.error(chalk.red('无效选择，退出。'));
      process.exit(1);
    }
    const chosen = envs[idx];
    console.log(chalk.cyan(`正在使用 ${chosen.key} 环境访问后台服务...`));
    spawnDev(
      chosen.key,
      chosen.baseUrl || process.env.BACKEND_BASE_URL || '',
      chosen.lanBaseUrl || '',
    );
  });
}

const arg = process.argv[2];
interactiveSelect(arg);
