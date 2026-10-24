import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting SchoolNext ERP Development Environment...\n');

const backend = spawn('npm', ['--prefix', 'backend', 'run', 'dev'], {
  cwd: rootDir,
  shell: true,
  stdio: 'inherit',
});

const frontend = spawn('npm', ['--prefix', 'frontend', 'run', 'dev'], {
  cwd: rootDir,
  shell: true,
  stdio: 'inherit',
});

function handleExit(code) {
  backend.kill();
  frontend.kill();
  process.exit(code);
}

process.on('SIGINT', () => handleExit(0));
process.on('SIGTERM', () => handleExit(0));
