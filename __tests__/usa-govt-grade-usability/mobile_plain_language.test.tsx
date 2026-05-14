import { render, screen } from '@testing-library/react';
import { TripSettings } from '../components/trips/TripSettings';

describe('OMB M-23-22: Mobile-First & Plain Language', () => {
  it('should use plain language for complex privacy settings', () => {
    render(<TripSettings />);
    
    const privacyLabel = screen.getByText(/who can see your itinerary\?/i);
    expect(privacyLabel).toBeInTheDocument();
  });

  it('should have touch-friendly targets (minimum 44x44px) for mobile usability', () => {
    render(<TripSettings />);
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    
    const style = window.getComputedStyle(deleteButton);
    expect(parseInt(style.height)).toBeGreaterThanOrEqual(44);
  });
});