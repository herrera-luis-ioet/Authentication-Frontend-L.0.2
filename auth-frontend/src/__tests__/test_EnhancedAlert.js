import React from 'react';
import { render, screen } from '@testing-library/react';
import EnhancedAlert from '../components/shared/EnhancedAlert';

describe('EnhancedAlert Component', () => {
  const testMessage = 'Test alert message';

  it('should render with error severity', () => {
    render(<EnhancedAlert severity="error" message={testMessage} />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(testMessage);
    expect(alert).toHaveClass('MuiAlert-standardError');
  });

  it('should render with success severity', () => {
    render(<EnhancedAlert severity="success" message={testMessage} />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('MuiAlert-standardSuccess');
  });

  it('should render with warning severity', () => {
    render(<EnhancedAlert severity="warning" message={testMessage} />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('MuiAlert-standardWarning');
  });

  it('should render with info severity', () => {
    render(<EnhancedAlert severity="info" message={testMessage} />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('MuiAlert-standardInfo');
  });

  it('should have proper accessibility attributes', () => {
    render(<EnhancedAlert severity="info" message={testMessage} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('should apply custom styles through sx prop', () => {
    const customStyles = {
      backgroundColor: 'rgb(200, 200, 200)',
      padding: '24px'
    };
    
    render(
      <EnhancedAlert 
        severity="info" 
        message={testMessage} 
        sx={customStyles}
      />
    );
    
    const alert = screen.getByRole('alert');
    const styles = window.getComputedStyle(alert);
    expect(styles.backgroundColor).toBe('rgb(200, 200, 200)');
    expect(styles.padding).toBe('24px');
  });

  it('should apply slide animation styles', () => {
    render(<EnhancedAlert severity="info" message={testMessage} />);
    const alert = screen.getByRole('alert');
    const styles = window.getComputedStyle(alert);
    expect(styles.animation).toContain('slideIn');
  });
});