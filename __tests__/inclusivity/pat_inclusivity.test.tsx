import { render, screen } from '@testing-library/react';
import { DashboardNav } from '../components/dashboard/DashboardNav';

describe('GenderMag - Pat Persona (Goal-Oriented/Medium-Confidence)', () => {
  it('should prioritize familiar navigation labels over "clever" icons', () => {
    render(<DashboardNav />);
    
    const tripLink = screen.getByText(/My Trips/i);
    expect(tripLink).toBeInTheDocument();
  });

  it('should surface "Mastered Features" prominently', () => {
    render(<DashboardNav />);
    
    const searchBar = screen.getByPlaceholderText(/search destinations/i);
    expect(searchBar).toBeInTheDocument();
  });
});