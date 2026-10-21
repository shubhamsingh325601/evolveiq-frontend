/**
 * EvolvIQ design tokens — "Dawn".
 *
 * The single source of truth for colour, type, radius and depth across all
 * three apps. Per NAMING_CONVENTIONS.md these values are never redefined in an
 * app-level tailwind.config.js; apps only extend `content`.
 *
 * The product sits under a dawn sky: a night-indigo rail, a pale mist backdrop
 * that warms toward peach, and translucent white surfaces that pick up that
 * light. Every hue still carries exactly one meaning, and none is used for
 * flourish:
 *   iris   primary action, navigation, anything the user can do
 *   lilac  a person's own words about a child (always paired with the serif)
 *   jade   growth areas, completed work, positive progress
 *   honey  awaiting a psychologist's review
 *   coral  flagged significant, or destructive — the only colour that means "look now"
 * Peach exists only inside the `dawn` and `hero` glows. It never means anything.
 *
 * Three small sets sit outside that scheme, each with a single job:
 *   ehi    the five pillars of the EvolvIQ Holistic Index, as chart series.
 *          Identity only, only inside an EHI chart, always beside a label.
 *   flame  a student's streak, and nothing else.
 *   star   a star a child was given for something good someone noticed, and
 *          nothing else. Always drawn with the star itself and a count or words.
 */

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        mist: '#F4F3FA',
        night: {
          DEFAULT: '#17153B',
          800: '#1F1C4D',
          700: '#2A2663',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          sunk: '#F7F6FC',
        },
        ink: {
          DEFAULT: '#1C1B3A',
          muted: '#4E5074',
          faint: '#717392',
          inverse: '#F7F6FF',
        },
        line: {
          DEFAULT: '#E2E1F0',
          strong: '#C9C8E0',
          soft: '#EDECF6',
        },
        iris: {
          50: '#EEF0FF',
          100: '#E0E3FF',
          200: '#C5C9FF',
          300: '#A2A7FA',
          400: '#7C80F0',
          500: '#5558E6',
          600: '#4644CF',
          700: '#3A35AB',
          800: '#2C2885',
          900: '#1F1C5E',
        },
        lilac: {
          50: '#F6F2FF',
          100: '#EDE5FF',
          200: '#DCCCFF',
          300: '#C4AAFB',
          400: '#A98AF3',
          500: '#8E6CEB',
          600: '#7650D9',
          700: '#5F3DB8',
        },
        jade: {
          50: '#E9F8F1',
          100: '#CBEEDF',
          300: '#72D0AA',
          400: '#3DBB8B',
          500: '#1FA878',
          600: '#178A62',
          700: '#11704F',
        },
        honey: {
          50: '#FFF7E6',
          100: '#FFEBC0',
          300: '#FFD27A',
          400: '#FFC24A',
          500: '#F5AE1F',
          700: '#8A5A04',
        },
        coral: {
          50: '#FFF1EE',
          100: '#FFDCD5',
          300: '#FF9E8C',
          400: '#F77C68',
          500: '#F2604D',
          600: '#C8392A',
          700: '#A42D20',
        },
        // The EHI's five pillars, outermost ring first. Validated as one
        // categorical set in this order (dataviz six checks: CVD-safe for
        // neighbouring rings). Skills and physical sit under 3:1 on white,
        // so every chart that uses them prints each pillar's value beside it.
        ehi: {
          education: '#6366F1',
          skills: '#10B981',
          physical: '#F59E0B',
          wellbeing: '#EC4899',
          character: '#8B5CF6',
        },
        flame: {
          50: '#FFF4EC',
          200: '#FED7AA',
          500: '#F97316',
          700: '#C2410C',
        },
        // Gold, kept yellower than honey so a star never reads as "awaiting review".
        star: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
        },
      },

      fontFamily: {
        // The system's own voice: navigation, labels, buttons, tables. Lexend
        // was drawn to reduce visual stress in reading, which matters on a
        // product children and tired parents both use.
        sans: ['Lexend', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        // Reserved for text a person actually wrote about a child.
        serif: ['Literata', 'ui-serif', 'Georgia', 'Cambria', 'serif'],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.3125rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.005em' }],
        '2xl': ['1.5625rem', { lineHeight: '2rem', letterSpacing: '-0.015em' }],
        '3xl': ['1.9375rem', { lineHeight: '2.375rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.4375rem', { lineHeight: '2.75rem', letterSpacing: '-0.025em' }],
        '5xl': ['3.0625rem', { lineHeight: '3.25rem', letterSpacing: '-0.03em' }],
      },

      borderRadius: {
        // Radius follows hierarchy: the further a surface sits from the page,
        // the rounder it is. Student-facing surfaces go one step rounder still.
        none: '0',
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        // Controls: inputs, buttons, chips.
        lg: '12px',
        xl: '16px',
        // Cards.
        '2xl': '20px',
        // Shell: the rail, the report header, dialogs.
        '3xl': '28px',
        full: '9999px',
      },

      boxShadow: {
        // Depth tells you which layer something is on, so each gets one shadow.
        // Every shadow is tinted with the night indigo, never neutral grey.
        card: 'inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 1px 2px rgba(23, 21, 59, 0.04), 0 12px 32px -18px rgba(46, 42, 130, 0.28)',
        raised: '0 24px 48px -24px rgba(46, 42, 130, 0.5)',
        glow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 10px 24px -10px rgba(85, 88, 230, 0.75)',
        overlay: '0 32px 64px -24px rgba(23, 21, 59, 0.5)',
        none: 'none',
      },

      backgroundImage: {
        // Behind everything: the glass surfaces above it are translucent so
        // they pick up this light rather than blurring it.
        dawn: [
          'radial-gradient(56rem 36rem at 0% 0%, rgba(124, 128, 240, 0.22), transparent 65%)',
          'radial-gradient(48rem 32rem at 100% 0%, rgba(169, 138, 243, 0.18), transparent 60%)',
          'radial-gradient(60rem 40rem at 100% 100%, rgba(255, 196, 160, 0.32), transparent 60%)',
        ].join(', '),
        // Royal blue into indigo into soft purple, with the dawn warmth rising
        // in one corner: kept for a student finishing an activity.
        hero: [
          'radial-gradient(34rem 22rem at 100% 100%, rgba(255, 190, 150, 0.36), transparent 70%)',
          'linear-gradient(120deg, #3446D6 0%, #4B4FE0 45%, #7650D9 100%)',
        ].join(', '),
        rail: [
          'radial-gradient(22rem 18rem at 0% 0%, rgba(124, 128, 240, 0.3), transparent 70%)',
          'linear-gradient(180deg, #1F1C4D 0%, #17153B 60%, #1B1747 100%)',
        ].join(', '),
        // The Holistic Report's header: deep indigo into plum, darker than
        // `hero` so the EHI in jade reads as the brightest thing on it.
        report: [
          'radial-gradient(18rem 14rem at 100% 0%, rgba(255, 255, 255, 0.12), transparent 70%)',
          'radial-gradient(14rem 12rem at 0% 100%, rgba(99, 102, 241, 0.35), transparent 70%)',
          'linear-gradient(135deg, #312E81 0%, #3730A3 50%, #581C87 100%)',
        ].join(', '),
        // A deep panel for AI insight cards on light pages.
        insight: 'linear-gradient(135deg, #17153B 0%, #1F1C5E 100%)',
      },

      maxWidth: {
        // Keeps observation prose under ~70 characters.
        prose: '34rem',
      },

      keyframes: {
        'streak-mark': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.12)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // Dialogs, sheets and menus arriving in answer to a tap.
        rise: {
          '0%': { transform: 'translateY(12px) scale(0.98)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        // The one celebratory moment: a student finishing an activity.
        celebrate: {
          '0%': { transform: 'scale(0.4) rotate(-12deg)', opacity: '0' },
          '60%': { transform: 'scale(1.08) rotate(3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0)', opacity: '1' },
        },
        // A newly given star settling into place on a child's profile.
        'star-pop': {
          '0%': { transform: 'scale(0.3) rotate(-30deg)', opacity: '0' },
          '70%': { transform: 'scale(1.15) rotate(6deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0)', opacity: '1' },
        },
        halo: {
          '0%': { boxShadow: '0 0 0 0 rgba(118, 80, 217, 0.45)' },
          '100%': { boxShadow: '0 0 0 36px rgba(118, 80, 217, 0)' },
        },
        // Charts draw themselves in once, when they first appear. Rings use
        // pathLength 100, so each sweeps from empty to its own value.
        'ring-fill': {
          '0%': { strokeDasharray: '0 100' },
        },
        // Lines use pathLength 1.
        'line-draw': {
          '0%': { strokeDashoffset: '1' },
          '100%': { strokeDashoffset: '0' },
        },
        'chart-grow': {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'streak-mark': 'streak-mark 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        rise: 'rise 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        celebrate: 'celebrate 640ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'star-pop': 'star-pop 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        halo: 'halo 1400ms ease-out 360ms both',
        'ring-fill': 'ring-fill 1100ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'line-draw': 'line-draw 1100ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'chart-grow': 'chart-grow 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'fade-in': 'fade-in 600ms ease-out 300ms both',
      },
    },
  },
  plugins: [],
};
