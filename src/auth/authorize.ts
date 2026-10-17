// Type-only: the library imports `cloudflare:workers`, which Node and tests can't load
import type {
  AuthorizationError,
  ConsentDescription,
} from '@cloudflare/workers-oauth-provider';
import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';

/** The only user. The consent page signs the owner in with the API_KEY secret. */
const OWNER_ID = 'owner';

const escape = (value: string): string =>
  value.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);

const htmlPage = (title: string, body: string): string => `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 32rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.5; }
  input[type=password] { width: 100%; padding: .5rem; margin: .25rem 0 1rem; box-sizing: border-box; }
  button { padding: .5rem 1rem; margin-right: .5rem; }
  .warn { background: #fff3cd; color: #664d03; padding: .5rem .75rem; border-radius: 4px; }
</style>
${body}
</html>`;

const consentPage = (details: ConsentDescription, handle: string): string => {
  const name = escape(details.clientName);
  const origin = details.clientDomain
    ? `Published by <strong>${escape(details.clientDomain)}</strong>.`
    : 'This app registered itself; its name is not verified.';
  const loopback = details.redirectIsLoopback
    ? '<p class="warn"><strong>This sends access to an app on your computer.</strong> Continue only if you just started signing in from it.</p>'
    : '';
  const scopes = details.scope.map(escape).join(', ') || 'none';

  return htmlPage(
    `Authorize ${details.clientName}`,
    `<h1>Allow ${name} to use Query?</h1>
<p>${origin} Access will be sent to <strong>${escape(details.redirectHost)}</strong>.</p>
${loopback}
<p>Scopes: ${scopes}</p>
<form method="post">
  <input type="hidden" name="handle" value="${escape(handle)}">
  <label for="password">Owner password (API key)</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required>
  <button name="decision" value="approve">Allow</button>
  <button name="decision" value="deny" formnovalidate>Deny</button>
</form>`,
  );
};

/**
 * Compare two secrets in constant time by comparing their SHA-256 digests.
 */
const secretsMatch = async (
  given: string,
  expected: string,
): Promise<boolean> => {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all(
    [given, expected].map(value =>
      crypto.subtle.digest('SHA-256', encoder.encode(value)),
    ),
  );
  const left = new Uint8Array(a!);
  const right = new Uint8Array(b!);

  let diff = 0;
  for (let i = 0; i < left.length; i++) {
    diff |= left[i]! ^ right[i]!;
  }
  return diff === 0;
};

const formText = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
};

const notConfigured = (ctx: Context<AppEnv>): Response =>
  ctx.html(
    htmlPage(
      'Not configured',
      '<h1>Sign-in is not configured</h1><p>Set the API_KEY secret and run the Worker entry (src/worker.ts), which enables OAuth.</p>',
    ),
    503,
  );

type AuthorizeHandler = (ctx: Context<AppEnv>) => Promise<Response>;

const isAuthorizationError = (err: unknown): err is AuthorizationError =>
  err instanceof Error && err.name === 'AuthorizationError';

/**
 * Answer expected OAuth request errors: redirect to the client when the
 * library has validated its redirect URI, otherwise render the error locally.
 */
const withAuthorizationErrors =
  (handler: AuthorizeHandler): AuthorizeHandler =>
  async ctx => {
    try {
      return await handler(ctx);
    } catch (err) {
      if (!isAuthorizationError(err)) throw err;
      if (err.redirectTo) return ctx.redirect(err.redirectTo, 302);
      return ctx.html(
        htmlPage(
          'Authorization failed',
          `<h1>Authorization failed</h1><p>${escape(err.description)}</p>`,
        ),
        400,
      );
    }
  };

/**
 * GET /authorize: validate the OAuth request and show the consent page.
 */
export const handleAuthorizePage = withAuthorizationErrors(async ctx => {
  const oauth = ctx.env.OAUTH_PROVIDER;
  if (!ctx.env.API_KEY || !oauth) return notConfigured(ctx);

  const request = await oauth.parseAuthRequest(ctx.req.raw);
  const details = await oauth.describeConsent(request);
  const consent = await oauth.beginConsent(request);

  consent.headers.set('Content-Type', 'text/html; charset=utf-8');
  consent.headers.set('Cache-Control', 'no-store');
  return new Response(consentPage(details, consent.handle), {
    headers: consent.headers,
  });
});

/**
 * POST /authorize: check the owner password, then approve or deny.
 */
export const handleAuthorizeDecision = withAuthorizationErrors(async ctx => {
  const apiKey = ctx.env.API_KEY;
  const oauth = ctx.env.OAUTH_PROVIDER;
  if (!apiKey || !oauth) return notConfigured(ctx);

  const form = await ctx.req.formData();
  const handle = formText(form, 'handle');

  if (form.get('decision') !== 'approve') {
    const denied = await oauth.denyConsent(ctx.req.raw, handle);
    denied.headers.set('Location', denied.redirectTo);
    return new Response(null, { status: 302, headers: denied.headers });
  }

  const password = formText(form, 'password');
  if (!(await secretsMatch(password, apiKey))) {
    return ctx.html(
      htmlPage(
        'Wrong password',
        '<h1>Wrong password</h1><p>Go back and try again.</p>',
      ),
      401,
    );
  }

  const approved = await oauth.approveConsent(ctx.req.raw, handle);
  const { redirectTo } = await oauth.completeAuthorization({
    request: approved.request,
    userId: OWNER_ID,
    metadata: {},
    scope: approved.request.scope,
    props: { userId: OWNER_ID },
  });

  approved.headers.set('Location', redirectTo);
  return new Response(null, { status: 302, headers: approved.headers });
});
