import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Step1Identity from '@/components/RegisterWizard/Step1Identity';

describe('Step1Identity', () => {
  it('renders all inputs', () => {
    render(<Step1Identity initial={{}} onNext={() => {}} />);
    expect(screen.getByPlaceholderText(/Kieffer/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/0712345678/i)).toBeInTheDocument();
  });

  it('rejects invalid phone', () => {
    const onNext = vi.fn();
    render(<Step1Identity initial={{}} onNext={onNext} />);
    fireEvent.change(screen.getByPlaceholderText(/Kieffer/i), { target: { value: 'Kieffer Madyedye' } });
    fireEvent.change(screen.getByPlaceholderText(/0712345678/i), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText(/0623456789/i), { target: { value: '0623456789' } });
    fireEvent.change(screen.getByPlaceholderText(/Angalau herufi 6/i), { target: { value: 'abcdef' } });
    fireEvent.change(screen.getByPlaceholderText(/Rudia password/i), { target: { value: 'abcdef' } });
    fireEvent.click(screen.getByText(/Endelea/i));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText(/si sahihi/i)).toBeInTheDocument();
  });

  it('advances with valid data', () => {
    const onNext = vi.fn();
    render(<Step1Identity initial={{}} onNext={onNext} />);
    fireEvent.change(screen.getByPlaceholderText(/Kieffer/i), { target: { value: 'Kieffer Madyedye' } });
    fireEvent.change(screen.getByPlaceholderText(/0712345678/i), { target: { value: '0712345678' } });
    fireEvent.change(screen.getByPlaceholderText(/0623456789/i), { target: { value: '0623456789' } });
    fireEvent.change(screen.getByPlaceholderText(/Angalau herufi 6/i), { target: { value: 'abcdef' } });
    fireEvent.change(screen.getByPlaceholderText(/Rudia password/i), { target: { value: 'abcdef' } });
    fireEvent.click(screen.getByText(/Endelea/i));
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({
      full_name: 'Kieffer Madyedye', phone_primary: '0712345678', phone_alt: '0623456789', password: 'abcdef',
    }));
  });
});
