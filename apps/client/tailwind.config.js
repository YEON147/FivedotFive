/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          main: "var(--color-primary-main)",
          pressed: "var(--color-primary-pressed)",
          light: "var(--color-primary-light)",
        },
        accent: {
          pink: "var(--color-accent-pink)",
          mint: "var(--color-accent-mint)",
        },
        brand: {
          blue: "var(--color-brand-blue)",
          green: "var(--color-brand-green)",
          coral: "var(--color-brand-coral)",
        },
        bg: {
          base: "var(--color-bg-base)",
          subtle: "var(--color-bg-subtle)",
          lavender: "var(--color-bg-lavender)",
        },
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          disabled: "var(--color-text-disabled)",
          inverse: "var(--color-text-inverse)",
        },
      },
    },
  },
};
