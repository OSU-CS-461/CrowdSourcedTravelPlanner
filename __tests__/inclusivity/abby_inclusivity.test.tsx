import { render, screen } from '@testing-library/react';
import { TripCreationWizard } from '../components/trips/TripCreationWizard';

describe('GenderMag - Abby Persona (Comprehensive/Risk-Averse)', () => {
  it('should provide clear "Back" or "Cancel" safety nets in the creation flow', () => {
    render(<TripCreationWizard />);
    
    const backButton = screen.getByRole('button', { name: /back|cancel/i });
    expect(backButton).toBeInTheDocument();
  });

  it('should include hint text explaining why a step is necessary', () => {
    render(<TripCreationWizard />);
    
    const explanation = screen.getByText(/your data is used only for travel matching/i);
    expect(explanation).toBeInTheDocument();
  });
});