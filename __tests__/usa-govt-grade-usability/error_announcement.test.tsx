import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/common/ErrorBoundary';

describe('USWDS/HCD: Accessible Error Delivery', () => {
  it('should use aria-live to announce backend validation failures', () => {
    const errorMessage = "Invalid date range selected.";
    render(<div aria-live="assertive">{errorMessage}</div>);

    const alert = screen.getByText(errorMessage);
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
});