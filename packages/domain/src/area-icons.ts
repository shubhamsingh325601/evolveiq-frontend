import type { DevelopmentArea } from '@evolveiq/api-client';
import {
  Brain,
  Footprints,
  Hand,
  Heart,
  MessageCircle,
  Puzzle,
  Target,
  Users,
  type IconComponent,
} from '@evolveiq/ui';

/**
 * One drawing per development area, used wherever the area's name appears
 * beside it. Icons only ever accompany the label from `labels.ts` — they
 * help a child or a skimming parent find their place, never replace words.
 */
export const DEVELOPMENT_AREA_ICONS: Record<DevelopmentArea, IconComponent> = {
  'focus-and-attention': Target,
  'emotional-regulation': Heart,
  'social-interaction': Users,
  'language-and-expression': MessageCircle,
  'motor-skills': Hand,
  'problem-solving': Puzzle,
  independence: Footprints,
  'memory-and-recall': Brain,
};
