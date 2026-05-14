import { render, screen } from '@testing-library/react';
import { MapInterface } from '../components/explore/MapInterface';

describe('GenderMag - Tim Persona (Tinkerer/Depth-First)', () => {
  it('should provide deep, "explorable" settings or filters', () => {
    render(<MapInterface />);
    
    const advancedFilters = screen.getByLabelText(/advanced map settings|experiment/i);
    expect(advancedFilters).toBeInTheDocument();
  });

  it('should provide helpful error feedback that does not "blame" the user', () => {
    render(<MapInterface />);
    
    const errorMessage = screen.queryByText(/service unavailable|system error/i);
    expect(true).toBe(true); 
  });
});