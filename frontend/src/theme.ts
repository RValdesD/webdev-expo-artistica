import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#c5a059', // Champagne Gold
      light: '#e5c178',
      dark: '#9c7b39',
      contrastText: '#0a0b0e',
    },
    secondary: {
      main: '#d97d54', // Warm Terracotta
      light: '#ea9974',
      dark: '#b35d36',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0c0d10', // Deep obsidian gallery
      paper: '#14171d',   // Elevated museum slate
    },
    text: {
      primary: '#f4f2ec',   // Warm museum white
      secondary: '#a6a39d', // Oyster gray
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    error: {
      main: '#e05d5d',
    },
    warning: {
      main: '#e59840',
    },
    success: {
      main: '#52b788',
    },
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: {
      fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
      fontWeight: 600,
      letterSpacing: '-0.02em',
      color: '#f4f2ec',
    },
    h2: {
      fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
      fontWeight: 500,
      letterSpacing: '-0.015em',
      color: '#f4f2ec',
    },
    h3: {
      fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
      fontWeight: 500,
      color: '#f4f2ec',
    },
    h4: {
      fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
      fontWeight: 500,
    },
    button: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    caption: {
      letterSpacing: '0.05em',
      color: '#a6a39d',
    },
  },
  shape: {
    borderRadius: 3,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0c0d10',
          color: '#f4f2ec',
          scrollbarColor: '#282b33 #0c0d10',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#0c0d10',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#282b33',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#c5a059',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          padding: '10px 22px',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        },
        contained: {
          backgroundColor: '#c5a059',
          color: '#0a0b0e',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#e5c178',
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 20px rgba(197, 160, 89, 0.3)',
          },
        },
        outlined: {
          borderColor: 'rgba(197, 160, 89, 0.4)',
          color: '#c5a059',
          '&:hover': {
            borderColor: '#c5a059',
            backgroundColor: 'rgba(197, 160, 89, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#14171d',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 4,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            borderColor: 'rgba(197, 160, 89, 0.35)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#111318',
          borderRadius: 3,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(197, 160, 89, 0.4)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#c5a059',
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600,
          color: '#a6a39d',
          '&.Mui-selected': {
            color: '#c5a059',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#c5a059',
          height: '2px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          letterSpacing: '0.04em',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;
