import { spawn, type ChildProcess } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || '3000');
// Port 8000 is reserved by the AI Studio control-plane-api, so bind Python backend to 8001.
const PYTHON_PORT = Number(process.env.PYTHON_BACKEND_PORT || '8001');

let pythonProc: ChildProcess | null = null;
let isShuttingDown = false;

function waitForPythonReady(timeoutMs = 15000): Promise<void> {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(
        {
          hostname: '127.0.0.1',
          port: PYTHON_PORT,
          path: '/health',
          timeout: 800,
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => {
            raw += chunk;
          });
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const parsed = JSON.parse(raw) as { engine?: string };
                if (parsed.engine === 'insightpy-python') {
                  resolve();
                  return;
                }
              } catch {
                // Keep retrying until InsightPy Python responds
              }
            }
            retry();
          });
        }
      );
      req.on('error', retry);
      req.on('timeout', () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startedAt >= timeoutMs) {
        resolve();
        return;
      }
      setTimeout(check, 200);
    };

    check();
  });
}

function startPythonBackend(): void {
  if (pythonProc || isShuttingDown) return;

  pythonProc = spawn('python3', ['-m', 'backend.server'], {
    cwd: __dirname,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      PYTHON_BACKEND_PORT: String(PYTHON_PORT),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  pythonProc.stdout?.on('data', (chunk: Buffer) => {
    process.stdout.write(`[python-api] ${chunk.toString()}`);
  });

  pythonProc.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[python-api] ${chunk.toString()}`);
  });

  pythonProc.on('exit', (code) => {
    pythonProc = null;
    if (!isShuttingDown) {
      console.error(`[python-api] exited with code ${code ?? 'unknown'}, restarting in 1s...`);
      setTimeout(() => startPythonBackend(), 1000);
    }
  });
}

function shutdownChildren(): void {
  isShuttingDown = true;
  if (pythonProc) {
    pythonProc.kill('SIGTERM');
    pythonProc = null;
  }
}

process.on('SIGINT', () => {
  shutdownChildren();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shutdownChildren();
  process.exit(0);
});
process.on('exit', shutdownChildren);

function proxyToPythonApi(req: Request, res: Response): void {
  const targetPath = req.originalUrl.replace(/^\/api/, '') || '/';
  const headers: http.OutgoingHttpHeaders = { ...req.headers };
  delete headers.host;

  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: PYTHON_PORT,
      path: targetPath,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.status(proxyRes.statusCode || 502);
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      }
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.status(503).json({
        detail: `Python backend is starting or unavailable (${err.message}).`,
      });
    }
  });

  req.pipe(proxyReq);
}

async function bootstrap(): Promise<void> {
  startPythonBackend();
  await waitForPythonReady(12000);

  const app = express();
  app.use('/api', proxyToPythonApi);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InsightPy server listening on http://0.0.0.0:${PORT} (Python backend on :${PYTHON_PORT})`);
  });
}

void bootstrap();
