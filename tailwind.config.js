/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          blue:       '#0066cc',
          'blue-hover': '#0071e3',
          'blue-sky': '#2997ff',
          ink:        '#1d1d1f',
          'ink-80':   '#333333',
          'ink-48':   '#7a7a7a',
          muted:      '#cccccc',
          canvas:     '#ffffff',
          parchment:  '#f5f5f7',
          pearl:      '#fafafc',
          hairline:   '#e0e0e0',
          divider:    '#f0f0f0',
          'tile-1':   '#272729',
          black:      '#000000',
        },
      },
      fontFamily: {
        sans: ['"SF Pro Text"', '"Noto Sans KR"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"SF Pro Display"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
