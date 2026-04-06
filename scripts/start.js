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

    // 端口检测 — 如果 baseUrl 可解析出端口，检查端口占用并提供选项
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
        const act = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: `检测到 ${host}:${parsedPort} 端口已被占用，选择处理方式：`,
            choices: [
              { name: '切换其他环境', value: 'switch' },
              { name: '尝试终止占用进程（可能需要管理员权限）', value: 'kill' },
              { name: '直接继续启动（可能失败）', value: 'continue' },
            ],
          },
        ]);

        if (act.action === 'switch') {
          return interactiveSelect();
        }

        if (act.action === 'kill') {
          const pids = await getPidsByPort(parsedPort);
          if (!pids || pids.length === 0) {
            console.log(
              chalk.yellow('未找到占用该端口的进程 PID，无法自动终止。'),
            );
            const retry = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'cont',
                message: '是否继续启动？',
                default: false,
              },
            ]);
            if (!retry.cont) return interactiveSelect();
            console.log(chalk.cyan(`以 ${chosen.key} 环境启动 dev 服务...`));
            spawnDev(
              chosen.key,
              chosen.baseUrl || process.env.BACKEND_BASE_URL || '',
              chosen.lanBaseUrl || '',
            );
            return;
          }

          console.log(chalk.cyan(`尝试终止 PID: ${pids.join(', ')}`));
          const res = await killPids(pids);
          if (res.success) {
            // 等待短暂时间以释放端口
            await new Promise((r) => setTimeout(r, 700));
            if (await isPortInUse(host, parsedPort)) {
              console.log(chalk.red('端口仍被占用，无法终止所有进程。'));
              const retry = await inquirer.prompt([
                {
                  type: 'confirm',
                  name: 'cont',
                  message: '是否切换环境？（否将继续尝试启动）',
                  default: true,
                },
              ]);
              if (retry.cont) return interactiveSelect();
            }
          } else {
            console.log(
              chalk.red('终止进程失败：' + (res.message || '未知错误')),
            );
            const retry = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'cont',
                message: '是否切换环境？（否将继续尝试启动）',
                default: true,
              },
            ]);
            if (retry.cont) return interactiveSelect();
          }
        }

        console.log(chalk.cyan(`以 ${chosen.key} 环境启动 dev 服务...`));
        spawnDev(
          chosen.key,
          chosen.baseUrl || process.env.BACKEND_BASE_URL || '',
          chosen.lanBaseUrl || '',
        );
        return;
      }
    }

    console.log(chalk.cyan(`正在以 ${chosen.key} 环境启动 dev 服务...`));
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

  console.log('请选择要启动的环境（输入编号并回车）：');
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
    console.log(chalk.cyan(`以 ${chosen.key} 环境启动 dev 服务...`));
    spawnDev(
      chosen.key,
      chosen.baseUrl || process.env.BACKEND_BASE_URL || '',
      chosen.lanBaseUrl || '',
    );
  });
}

const arg = process.argv[2];
interactiveSelect(arg);
