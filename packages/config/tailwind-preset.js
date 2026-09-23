/**
 * EvolvIQ design tokens — "Chalkline".
 *
 * The single source of truth for colour, type and spacing across all three
 * apps. Per NAMING_CONVENTIONS.md these values are never redefined in an
 * app-level tailwind.config.js; apps only extend `content`.
 *
 * Colour here is semantic, not decorative. Each hue carries one meaning and
 * is never used for flourish:
 *   teal      primary action, navigation, anything the user can do
 *   moss      growth areas, completed work, positive progress
 *   amber     awaiting a psychologist's review
 *   raspberry flagged significant — the only colour that means "look now"
 */

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        paper: '#EFF1F3',
        surface: {
          DEFAULT: '#FFFFFF',
          sunk: '#F7F9FA',
        },
        ink: {
          DEFAULT: '#16232B',
          muted: '#5A6B74',
          faint: '#8C9AA1',
          inverse: '#F2F6F7',
        },
        line: {
          DEFAULT: '#D5DCE0',
          strong: '#B6C1C7',
          soft: '#E6EAED',
        },
        teal: {
          50: '#E7F1F3',
          100: '#C9E0E5',
          200: '#9BC6CE',
          300: '#6BA9B5',
          400: '#3D8A99',
          500: '#125E6B',
          600: '#0E4C57',
          700: '#0B3A43',
          800: '#08292F',
          900: '#05191D',
        },
        moss: {
          50: '#E8F3EC',
          100: '#C8E3D2',
          300: '#79BC94',
          500: '#3E8E5A',
          700: '#2A6640',
        },
        amber: {
          50: '#FDF3DF',
          100: '#F8E2B0',
          300: '#E8C25E',
          500: '#D9A31E',
          700: '#8A6710',
        },
        raspberry: {
          50: '#FBE9EF',
          100: '#F4C7D6',
          300: '#E0799C',
          500: '#C6416B',
          700: '#8E2B4B',
        },
      },

      fontFamily: {
        // System chrome: tables, labels, buttons, navigation.
        sans: [
          '"Public Sans"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        // Reserved for text a person actually wrote about a child.
        serif: ['Newsreader', 'ui-serif', 'Georgia', 'Cambria', 'serif'],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5625rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '3xl': ['1.9375rem', { lineHeight: '2.375rem', letterSpacing: '-0.015em' }],
        '4xl': ['2.4375rem', { lineHeight: '2.75rem', letterSpacing: '-0.02em' }],
        '5xl': ['3.0625rem', { lineHeight: '3.25rem', letterSpacing: '-0.025em' }],
      },

      borderRadius: {
        none: '0',
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        // Student-facing surfaces only — radius scales with the audience's age.
        lg: '10px',
        xl: '14px',
        full: '9999px',
      },

      boxShadow: {
        // Modals and popovers are the only surfaces that lift off the page.
        overlay: '0 12px 32px -8px rgba(16, 35, 43, 0.28)',
        none: 'none',
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
      },
      animation: {
        'streak-mark': 'streak-mark 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};
