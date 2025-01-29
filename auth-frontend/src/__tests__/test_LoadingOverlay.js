import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingOverlay from '../components/shared/LoadingOverlay';

describe('LoadingOverlay Component', () => {
  it('should not render when show is false', () => {
    render(<LoadingOverlay show={false} />);
    const overlay = screen.queryByRole('progressbar');
    expect(overlay).not.toBeInTheDocument();
  });

  it('should render with default size when show is true', () => {
    render(<LoadingOverlay show={true} />);
    const overlay = screen.getByRole('progressbar');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute('aria-busy', 'true');
    expect(overlay).toHaveAttribute('aria-label', 'Loading');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<LoadingOverlay show={true} size="small" />);
    const smallOverlay = screen.getByRole('progressbar');
    expect(smallOverlay).toBeInTheDocument();

    rerender(<LoadingOverlay show={true} size="large" />);
    const largeOverlay = screen.getByRole('progressbar');
    expect(largeOverlay).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingOverlay show={true} />);
    const overlay = screen.getByRole('progressbar');
    expect(overlay).toHaveAttribute('aria-busy', 'true');
    expect(overlay).toHaveAttribute('aria-label', 'Loading');
  });

  it('should apply fade animation styles', () => {
    render(<LoadingOverlay show={true} />);
    const overlay = screen.getByRole('progressbar');
    const styles = window.getComputedStyle(overlay);
    expect(styles.animation).toContain('fadeIn');
    expect(styles.backgroundColor).toBe('rgba(255, 255, 255, 0.8)');
  });
});