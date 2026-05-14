import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTripForm } from '../components/trips/CreateTripForm';

describe('DHS Usability Standard: Task Success Measurement', () => {
  it('should allow a user to successfully create a trip in under 4 interactions', async () => {
    render(<CreateTripForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/destination/i), 'Portland');
    await user.click(screen.getByRole('button', { name: /save trip/i }));

    await waitFor(() => {
      expect(screen.getByText(/trip created successfully/i)).toBeInTheDocument();
    });
  });
});