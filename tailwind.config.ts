import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        f1red: '#E10600',
        f1dark: '#15151E',
        f1gray: '#38383F',
        f1light: '#F5F5F5',
      },
      fontFamily: {
        f1: ['var(--font-f1)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
