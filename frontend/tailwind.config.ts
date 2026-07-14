import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        todo: '#64748b',
        inprogress: '#2563eb',
        done: '#16a34a',
      },
    },
  },
  plugins: [],
};

export default config;
