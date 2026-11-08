import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}').replace(/\\/g, '/'),
    './frontend/index.html',
    './frontend/src/**/*.{js,ts,jsx,tsx}',
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#03170A',
          900: '#062A13', // Deep Forest
          850: '#073B1A', // Forest Green
          800: '#0B4822',
          700: '#0E5C2C',
          600: '#147A3C',
        },
        lime: {
          DEFAULT: '#32A817', // Bright Lime
          hover: '#268A12',
          fresh: '#48B52B',
          light: '#EAF4E6',
        },
        teal: {
          deep: '#00483F', // Deep Teal
          surface: '#0B301B',
        },
        eco: {
          bg: '#F5F7F2', // Main Background
          surface: '#FFFFFF', // White Surface
          light: '#EDF5E9', // Light Green Surface
          sage: '#E2EEDF', // Pale Sage
          border: '#E1E9DF', // Default Border
          borderGreen: '#C8DEC2', // Green Border
          text: '#17251A', // Primary Text
          secondary: '#667568', // Secondary Text
          muted: '#879487', // Muted Text
        },
        risk: {
          critical: '#DC3545',
          elevated: '#F59E0B',
          moderate: '#0EA5E9',
          stable: '#16A34A',
        },
        clima: {
          forest: '#063B22',
          primary: '#15803D',
          action: '#16A34A',
          light: '#EAF5E9',
          bg: '#F6F8F4',
          surface: '#FFFFFF',
          text: '#173526',
          muted: '#718078',
          border: '#DCE7DD',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'elevated': '0 4px 20px -2px rgba(7, 59, 26, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.04)',
        'hover': '0 8px 24px -4px rgba(7, 59, 26, 0.12)',
        'accent': '0 0 15px -3px rgba(50, 168, 23, 0.35)',
      },
    },
  },
  plugins: [],
}
