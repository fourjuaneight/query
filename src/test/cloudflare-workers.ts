// Minimal stand-in for the `cloudflare:workers` module so Worker-only
// libraries can load under Node in tests (aliased in vitest.config.ts).
export class WorkerEntrypoint<Env = unknown> {
  constructor(
    protected ctx: ExecutionContext,
    protected env: Env,
  ) {}
}
