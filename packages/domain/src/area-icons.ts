import type { ActivityType, DevelopmentArea, ObservationArea } from '@evolveiq/api-client';
import {
  Award,
  BookOpen,
  Brain,
  CircleHelp,
  CirclePlay,
  Footprints,
  Hand,
  Heart,
  ImageIcon,
  ListChecks,
  MessageCircle,
  Moon,
  PenLine,
  ShieldCheck,
  Sprout,
  Star,
  Target,
  Users,
  type IconComponent,
} from '@evolveiq/ui';
import { developmentAreaForName } from './labels';

/**
 * One drawing per area or type, used wherever its name appears beside it.
 * Icons only ever accompany the label from `labels.ts` — they help a child or
 * a skimming parent find their place, never replace words.
 */
export const OBSERVATION_AREA_ICONS: Record<ObservationArea, IconComponent> = {
  emotions: Heart,
  behaviour: ShieldCheck,
  social: Users,
  learning: BookOpen,
  communication: MessageCircle,
  physical: Footprints,
  routines: Moon,
  other: CircleHelp,
};

export const DEVELOPMENT_AREA_ICONS: Record<DevelopmentArea, IconComponent> = {
  managing_feelings: Heart,
  social_skills: Users,
  communication: MessageCircle,
  focus_attention: Target,
  self_control: Hand,
  confidence: Award,
  resilience: Sprout,
  independence: Footprints,
  learning_skills: Brain,
  motor_skills: Hand,
};

/** A growth area arrives by name; draw its development area's icon. */
export function growthAreaIcon(name: string): IconComponent {
  const area = developmentAreaForName(name);
  return area ? DEVELOPMENT_AREA_ICONS[area] : Sprout;
}

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, IconComponent> = {
  mcq: ListChecks,
  text: PenLine,
  image_pick: ImageIcon,
  rating: Star,
  media_response: CirclePlay,
};
