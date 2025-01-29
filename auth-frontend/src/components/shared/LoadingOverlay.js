import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { keyframes } from '@mui/system';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// PUBLIC_INTERFACE
/**
 * Loading overlay component with fade animation
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether to show the loading overlay
 * @param {string} [props.size='medium'] - Size of the loading spinner
 * @returns {JSX.Element|null} Loading overlay component
 */
const LoadingOverlay = ({ show, size = 'medium' }) => {
  if (!show) return null;

  const spinnerSizes = {
    small: 24,
    medium: 40,
    large: 56
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 1000,
        animation: `${fadeIn} 0.2s ease-in-out`,
      }}
      role="progressbar"
      aria-busy="true"
      aria-label="Loading"
    >
      <CircularProgress 
        size={spinnerSizes[size]} 
        sx={{
          color: 'primary.main',
          '& .MuiCircularProgress-circle': {
            strokeWidth: 4,
          }
        }}
      />
    </Box>
  );
};

export default LoadingOverlay;