import { describe, it, expect } from 'vitest';

import { extractVideoId } from './youtube';

const ID = 'dQw4w9WgXcQ';

describe('extractVideoId', () => {
  it.each([
    [ID],
    [`https://youtu.be/${ID}`],
    [`https://youtu.be/${ID}?si=abc123`],
    [`https://www.youtube.com/watch?v=${ID}`],
    [`https://youtube.com/watch?v=${ID}&t=42s`],
    [`https://www.youtube.com/watch?feature=share&v=${ID}`],
    [`https://m.youtube.com/watch?v=${ID}`],
    [`https://music.youtube.com/watch?v=${ID}&list=RD`],
    [`https://www.youtube.com/shorts/${ID}`],
    [`https://www.youtube.com/embed/${ID}?start=10`],
    [`https://www.youtube-nocookie.com/embed/${ID}`],
    [`https://www.youtube.com/live/${ID}`],
    [`youtube.com/watch?v=${ID}`],
    [`  ${ID}  `],
  ])('extracts the ID from %s', input => {
    expect(extractVideoId(input)).toBe(ID);
  });

  it.each([
    ['invalid-id'],
    ['https://example.com/watch?v=dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch'],
    ['https://youtu.be/too-short'],
    ['not a url'],
  ])('returns null for %s', input => {
    expect(extractVideoId(input)).toBeNull();
  });
});
