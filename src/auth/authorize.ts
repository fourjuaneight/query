// Type-only: the library imports `cloudflare:workers`, which Node and tests can't load
import type {
  AuthorizationError,
  ConsentDescription,
} from '@cloudflare/workers-oauth-provider';
import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import {
  MCP_SCOPE,
  OWNER_ID,
  type OwnerProps,
  keyFingerprint,
  secretsMatch,
} from './owner';

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

  return htmlPage(
    `Authorize ${details.clientName}`,
    `<h1>Allow ${name} to use Query?</h1>
<p>${origin} Access will be sent to <strong>${escape(details.redirectHost)}</strong>.</p>
${loopback}
<p>Access: read-only use of Query's lookup tools (${MCP_SCOPE}).</p>
<form method="post">
  <input type="hidden" name="handle" value="${escape(handle)}">
  <label for="password">Owner password (API key)</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required>
  <button name="decision" value="approve">Allow</button>
  <button name="decision" value="deny" formnovalidate>Deny</button>
</form>`,
  );
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

// Matched by name: the library's classes can't be imported outside Workers
const isAuthorizationError = (err: unknown): err is AuthorizationError =>
  err instanceof Error && err.name === 'AuthorizationError';

const isCimdFetchError = (err: unknown): boolean =>
  err instanceof Error && err.name === 'CimdFetchError';

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
      if (isCimdFetchError(err)) {
        // The client's metadata document (CIMD) could not be loaded or validated
        return ctx.html(
          htmlPage(
            'App not verified',
            '<h1>This app could not be verified</h1><p>Its metadata could not be loaded. Try again in a moment.</p>',
          ),
          502,
        );
      }
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

  let form: FormData;
  try {
    form = await ctx.req.formData();
  } catch {
    return ctx.html(
      htmlPage('Bad request', '<h1>Bad request</h1><p>Expected a form.</p>'),
      400,
    );
  }
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

  // Grant the one supported scope, whatever the client asked for
  const approved = await oauth.approveConsent(ctx.req.raw, handle, {
    scope: [MCP_SCOPE],
  });
  const props: OwnerProps = {
    userId: OWNER_ID,
    keyId: await keyFingerprint(apiKey),
  };
  const { redirectTo } = await oauth.completeAuthorization({
    request: approved.request,
    userId: OWNER_ID,
    metadata: {},
    scope: approved.request.scope,
    props,
    // The owner may connect several accounts of the same client (same
    // client_id and redirect URI); keep their grants side by side
    revokeExistingGrants: false,
  });

  approved.headers.set('Location', redirectTo);
  return new Response(null, { status: 302, headers: approved.headers });
});
