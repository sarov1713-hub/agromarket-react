import { spawn } from 'node:child_process';
import { backendDir, localEnvironment } from './e2e-environment.mjs';

const child = spawn(process.execPath, ['server.js'], { cwd: backendDir, env: localEnvironment(), stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 1));
