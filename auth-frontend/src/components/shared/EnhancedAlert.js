import React from 'react';
import Alert from '@mui/material/Alert';
import { keyframes } from '@mui/system';

const slideIn = keyframes`
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

// PUBLIC_INTERFACE
/**
 * Enhanced alert component with slide animation and improved styling
 * @param {Object} props - Component props
 * @param {string} props.severity - Alert severity (error, warning, info, success)
 * @param {string} props.message - Alert message
 * @param {Object} [props.sx] - Additional styles
 * @returns {JSX.Element} Enhanced alert component
 */
const EnhancedAlert = ({ severity, message, sx = {} }) => {
  return (
    <Alert
      severity={severity}
      sx={{
        width: '100%',
        animation: `${slideIn} 0.3s ease-out`,
        boxShadow: 2,
        borderRadius: 1,
        '& .MuiAlert-icon': {
          fontSize: '1.5rem',
        },
        '& .MuiAlert-message': {
          fontSize: '0.95rem',
          fontWeight: 500,
        },
        ...sx
      }}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </Alert>
  );
};

export default EnhancedAlert;