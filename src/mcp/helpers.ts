import type {
  CallToolResult,
  ToolAnnotations,
} from '@modelcontextprotocol/server';
import * as z from 'zod';

import { YEAR_RANGE } from '../common/constants';
import { describeError } from '../common/helpers';

/** Every tool only reads from 3rd-party APIs. */
export const READ_ONLY: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: true,
};

const errorResult = (message: string): CallToolResult => ({
  content: [{ type: 'text', text: message }],
  isError: true,
});

/**
 * Run a service call and wrap its data as a tool result.
 * A `null` result becomes a tool error with `notFound` as the message.
 * Thrown errors are mapped the same way as the REST API's error responses.
 *
 * @param call - The service call to run
 * @param notFound - Message returned when the call resolves to null
 * @returns The tool result
 */
export const runTool = async (
  call: () => Promise<unknown>,
  notFound = 'Nothing found',
): Promise<CallToolResult> => {
  try {
    const data = await call();
    if (data === null || data === undefined) return errorResult(notFound);
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  } catch (err) {
    return errorResult(describeError(err).message);
  }
};

// Shared input schemas (same rules as src/common/params.ts)

/** Trimmed, non-empty string. */
export const text = (description: string): z.ZodString =>
  z.string().trim().min(1).describe(description);

/** Optional trimmed string. */
export const optionalText = (description: string): z.ZodOptional<z.ZodString> =>
  z.string().trim().min(1).optional().describe(description);

/** Optional integer within a range (default minimum 1). */
export const int = (
  description: string,
  { min = 1, max }: { min?: number; max?: number } = {},
): z.ZodOptional<z.ZodNumber> => {
  const base = z.number().int().min(min);
  return (max === undefined ? base : base.max(max))
    .optional()
    .describe(description);
};

export const id = (description: string): z.ZodNumber =>
  z.number().int().min(1).describe(description);

export const page = (max?: number): z.ZodOptional<z.ZodNumber> =>
  int('Page number (starts at 1)', max === undefined ? {} : { max });

export const language = optionalText(
  'Language code for localized results (e.g. "en-US")',
);

export const year = int('Release year', YEAR_RANGE);
