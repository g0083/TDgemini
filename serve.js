import { createServer } from 'vite';

async function start() {
  const server = await createServer({
    configFile: './vite.config.js',
    server: {
      host: '0.0.0.0',
      port: 5173
    }
  });

  await server.listen();
  server.printUrls();

  // Keep process alive without relying on interactive TTY stdin
  process.stdin.resume();
}

start().catch((err) => {
  console.error('Server error:', err);
  process.exit(1);
});
