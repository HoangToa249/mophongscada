import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const windows = process.platform === 'win32';
const python = join(root, '.venv', windows ? 'Scripts/python.exe' : 'bin/python');
const frontend = join(root, 'frontend');

function run(command, args, cwd = root, shell = false) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell, env: {
    ...process.env,
    npm_config_cache: process.env.npm_config_cache ?? join(root, '.cache', 'npm'),
    PIP_CACHE_DIR: process.env.PIP_CACHE_DIR ?? join(root, '.cache', 'pip'),
  } });
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message ?? `${command} exited with code ${result.status}`);
  }
}

function setup() {
  const candidates = windows ? [['py', ['-3.12']], ['python', []]] : [['python3.12', []], ['python3', []]];
  const selected = candidates.find(([command, prefix]) => {
    const result = spawnSync(command, [...prefix, '-c', 'import sys; print("%d.%d" % sys.version_info[:2])'], { encoding: 'utf8' });
    return result.status === 0 && result.stdout.trim() === '3.12';
  });
  if (!selected) throw new Error('Install Python 3.12 with pip first (Windows: enable Add Python to PATH), then run npm run setup again.');
  console.log('Creating Python 3.12 environment...');
  run(selected[0], [...selected[1], '-m', 'venv', join(root, '.venv')]);
  run(python, ['-m', 'pip', 'install', '-r', join(root, 'backend/requirements.lock')]);
  // npm.cmd requires the Windows command interpreter. Arguments here are fixed.
  run(windows ? 'npm.cmd' : 'npm', ['ci', '--no-audit', '--no-fund'], frontend, windows);
  console.log('\nSetup complete. Run npm run dev to start PowerLab.');
}

function dev() {
  const vite = join(frontend, 'node_modules/vite/bin/vite.js');
  if (!existsSync(python) || !existsSync(vite)) throw new Error('Dependencies missing. Run npm run setup first.');
  const backend = spawn(python, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: join(root, 'backend'), stdio: 'inherit',
  });
  const web = spawn(process.execPath, [vite, '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: frontend, stdio: 'inherit',
  });
  let stopping = false;
  function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    for (const child of [backend, web]) if (child.exitCode === null) child.kill('SIGTERM');
  }
  for (const child of [backend, web]) {
    child.on('error', error => {console.error(error.message); stop(1);});
    child.on('exit', code => stop(code ?? 1));
  }
  process.on('SIGINT', () => stop(0));
  process.on('SIGTERM', () => stop(0));
  console.log('\nPowerLab: http://localhost:5173\nAPI: http://localhost:8000\nPress Ctrl+C to stop both services.\n');
}

try {
  if (process.argv[2] === 'setup') setup();
  else if (process.argv[2] === 'dev') dev();
  else throw new Error('Usage: node scripts/local.mjs setup|dev');
} catch (error) {
  console.error(`PowerLab: ${error.message}`);
  process.exitCode = 1;
}
