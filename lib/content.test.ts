import { describe, it, expect } from 'vitest';
import { getHomeContent } from './content';

describe('getHomeContent', () => {
  it('reads the fr home content with the DC-provided headline', async () => {
    const content = await getHomeContent('fr');
    expect(content.headline).toBe("Restituer son objectivité à l'art de l'avant-garde.");
  });
});
