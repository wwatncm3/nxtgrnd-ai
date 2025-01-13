import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0056D2', // CareerDay's blue
    },
    secondary: {
      main: '#F8B400', // Accent yellow
    },
    background: {
      default: '#f4f5f7', // Light gray background
    },
  },
  typography: {
    fontFamily: 'Poppins, Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 600 },
    h2: { fontSize: '1.5rem', fontWeight: 500 },
    body1: { fontSize: '1rem' },
  },
});

export default theme;
