import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step2Cadre from '@/components/RegisterWizard/Step2Cadre';

vi.mock('@/lib/api', () => ({
  getCadres: vi.fn(),
  getSubjects: vi.fn(),
}));

import { getCadres, getSubjects } from '@/lib/api';
import type { Cadre, Subject } from '@/lib/api';

const HEALTH_CADRES: Cadre[] = [
  { code: 'CO', category: 'health', display_name: 'Clinical Officer', requires_subjects: false },
  { code: 'NO', category: 'health', display_name: 'Nursing Officer (NO)', requires_subjects: false },
];

const EDU_CADRES: Cadre[] = [
  { code: 'TEACHER_PRIMARY', category: 'education', display_name: 'Mwalimu wa Elimu ya Msingi', requires_subjects: false, level: 'Primary' },
  { code: 'TEACHER_SECONDARY', category: 'education', display_name: 'Mwalimu wa Elimu ya Sekondari', requires_subjects: true, level: 'Secondary' },
];

const SUBJECTS: Subject[] = [
  { code: 'MATH', name: 'Mathematics', level: 'Secondary' },
  { code: 'BIO', name: 'Biology', level: 'Secondary' },
];

beforeEach(() => {
  vi.mocked(getCadres).mockReset();
  vi.mocked(getSubjects).mockReset();
});

describe('Step2Cadre', () => {
  it('loads cadres when a department is selected', async () => {
    vi.mocked(getCadres).mockResolvedValue(HEALTH_CADRES);
    render(<Step2Cadre initial={{}} onBack={() => {}} onNext={() => {}} />);

    fireEvent.click(screen.getByText(/Idara ya Afya/));

    await waitFor(() => expect(getCadres).toHaveBeenCalledWith('health'));
    const select = screen.getByRole('combobox');
    expect(select).toHaveTextContent('Clinical Officer');
    expect(select).toHaveTextContent('Nursing Officer (NO)');
  });

  it('blocks submission without a cadre', async () => {
    vi.mocked(getCadres).mockResolvedValue(HEALTH_CADRES);
    const onNext = vi.fn();
    render(<Step2Cadre initial={{}} onBack={() => {}} onNext={onNext} />);

    fireEvent.click(screen.getByText(/Idara ya Afya/));
    // The select is `required`, so native validation blocks a real browser submit.
    // Dispatch the submit event directly to exercise our own validation logic.
    const form = screen.getByText('Endelea →').closest('form')!;
    fireEvent.submit(form);

    expect(await screen.findByText(/chagua idara na kada/i)).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('submits a health cadre without subjects', async () => {
    vi.mocked(getCadres).mockResolvedValue(HEALTH_CADRES);
    const onNext = vi.fn();
    render(<Step2Cadre initial={{}} onBack={() => {}} onNext={onNext} />);

    fireEvent.click(screen.getByText(/Idara ya Afya/));
    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'CO' } });
    fireEvent.click(screen.getByText('Endelea →'));

    await waitFor(() =>
      expect(onNext).toHaveBeenCalledWith({ category: 'health', cadre_code: 'CO', subjects: [] })
    );
    // No subject picker for cadres that don't need subjects.
    expect(screen.queryByText('Mathematics')).not.toBeInTheDocument();
  });

  it('requires subjects for teachers and submits them', async () => {
    vi.mocked(getCadres).mockResolvedValue(EDU_CADRES);
    vi.mocked(getSubjects).mockResolvedValue(SUBJECTS);
    const onNext = vi.fn();
    render(<Step2Cadre initial={{}} onBack={() => {}} onNext={onNext} />);

    fireEvent.click(screen.getByText(/Idara ya Elimu/));
    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'TEACHER_SECONDARY' } });

    expect(await screen.findByText('Mathematics')).toBeInTheDocument();
    expect(getSubjects).toHaveBeenCalled();

    // Blocked until a subject is chosen.
    fireEvent.click(screen.getByText('Endelea →'));
    expect(await screen.findByText(/chagua angalau somo moja/i)).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Mathematics'));
    fireEvent.click(screen.getByText('Endelea →'));

    await waitFor(() =>
      expect(onNext).toHaveBeenCalledWith({
        category: 'education', cadre_code: 'TEACHER_SECONDARY', subjects: ['MATH'],
      })
    );
  });

  it('toggles subject selection', async () => {
    vi.mocked(getCadres).mockResolvedValue(EDU_CADRES);
    vi.mocked(getSubjects).mockResolvedValue(SUBJECTS);
    const onNext = vi.fn();
    render(<Step2Cadre initial={{}} onBack={() => {}} onNext={onNext} />);

    fireEvent.click(screen.getByText(/Idara ya Elimu/));
    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'TEACHER_SECONDARY' } });

    const mathBtn = await screen.findByText('Mathematics');
    fireEvent.click(mathBtn);
    fireEvent.click(mathBtn); // toggle off
    fireEvent.click(screen.getByText('Biology'));
    fireEvent.click(screen.getByText('Endelea →'));

    await waitFor(() =>
      expect(onNext).toHaveBeenCalledWith({
        category: 'education', cadre_code: 'TEACHER_SECONDARY', subjects: ['BIO'],
      })
    );
  });
});
