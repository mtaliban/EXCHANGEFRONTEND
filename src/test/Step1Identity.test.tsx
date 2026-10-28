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
    fireEvent.click(screen.getByText(/Endelea/i));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('shows no error when the step is first opened', () => {
    render(<Step1Identity initial={{}} onNext={() => {}} />);
    expect(screen.queryByText(/Tafadhali/)).not.toBeInTheDocument();
    expect(screen.queryByText(/si sahihi/)).not.toBeInTheDocument();
  });

  it('shows the required messages on an empty submit and does not advance', () => {
    const onNext = vi.fn();
    render(<Step1Identity initial={{}} onNext={onNext} />);
    fireEvent.click(screen.getByText(/Endelea/i));
    expect(screen.getByText('Tafadhali ingiza majina yako.')).toBeInTheDocument();
    expect(screen.getByText('Tafadhali ingiza namba yako ya simu.')).toBeInTheDocument();
    expect(screen.getByText('Tafadhali ingiza namba yako ya WhatsApp.')).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('rejects a too-short name', () => {
    const onNext = vi.fn();
    render(<Step1Identity initial={{}} onNext={onNext} />);
    fireEvent.change(screen.getByPlaceholderText(/Kieffer/i), { target: { value: 'Ke' } });
    fireEvent.change(screen.getByPlaceholderText(/0712345678/i), { target: { value: '0712345678' } });
    fireEvent.change(screen.getByPlaceholderText(/0623456789/i), { target: { value: '0623456789' } });
    fireEvent.click(screen.getByText(/Endelea/i));
    expect(screen.getByText('Jina lazima liwe na angalau herufi 3')).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only name', () => {
    const onNext = vi.fn();
    render(<Step1Identity initial={{}} onNext={onNext} />);
    fireEvent.change(screen.getByPlaceholderText(/Kieffer/i), { target: { value: '   ' } });
    fireEvent.change(screen.getByPlaceholderText(/0712345678/i), { target: { value: '0712345678' } });
    fireEvent.change(screen.getByPlaceholderText(/0623456789/i), { target: { value: '0623456789' } });
    fireEvent.click(screen.getByText(/Endelea/i));
    /* Nafasi tupu pekee = jina halipo → ujumbe wa "Tafadhali ingiza majina yako." */
    expect(screen.getByText('Tafadhali ingiza majina yako.')).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('clears the error as soon as the value becomes valid', () => {
    render(<Step1Identity initial={{}} onNext={() => {}} />);
    fireEvent.click(screen.getByText(/Endelea/i));
    expect(screen.getByText('Tafadhali ingiza majina yako.')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Kieffer/i), { target: { value: 'Kieffer Madyedye' } });
    expect(screen.queryByText('Tafadhali ingiza majina yako.')).not.toBeInTheDocument();
  });

  it('advances with valid data', () => {
    const onNext = vi.fn();
    render(<Step1Identity initial={{}} onNext={onNext} />);
    fireEvent.change(screen.getByPlaceholderText(/Kieffer/i), { target: { value: 'Kieffer Madyedye' } });
    fireEvent.change(screen.getByPlaceholderText(/0712345678/i), { target: { value: '0712345678' } });
    fireEvent.change(screen.getByPlaceholderText(/0623456789/i), { target: { value: '0623456789' } });
    fireEvent.click(screen.getByText(/Endelea/i));
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({
      full_name: 'Kieffer Madyedye', phone_primary: '0712345678', phone_alt: '0623456789',
    }));
  });
});
