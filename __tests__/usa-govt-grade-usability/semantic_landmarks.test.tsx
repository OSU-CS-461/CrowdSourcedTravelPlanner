import { render, screen } from '@testing-library/react';
import AppLayout from '../layouts/AppLayout';

describe('USWDS: Semantic Landmark Testing', () => {
  it('should contain a "main" landmark for screen reader jumping', () => {
    render(<AppLayout>Test Content</AppLayout>);
    
    const mainLandmark = screen.getByRole('main');
    expect(mainLandmark).toBeInTheDocument();
  });

  it('should provide a "Skip to main content" link for keyboard users', () => {
    render(<AppLayout>Test Content</AppLayout>);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });
});