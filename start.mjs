import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const standaloneRoot = path.join(appRoot, ".next", "standalone");
const rootServer = path.join(standaloneRoot, "server.js");
const nestedServer = path.join(standaloneRoot, "apps", "web", "server.js");
const nextCli = path.join(appRoot, "node_modules", "next", "dist", "bin", "next");
const server = existsSync(rootServer) ? rootServer : existsSync(nestedServer) ? nextCli : "";

if (!existsSync(server)) throw new Error("Production server not found. Run `npm run build` first.");

const args = server === nextCli ? [server, "start"] : [server];
const cwd = server === nextCli ? appRoot : path.dirname(server);
const child = spawn(process.execPath, args, { cwd, env: process.env, stdio: "inherit" });
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
