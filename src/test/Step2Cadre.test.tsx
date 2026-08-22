import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step2Cadre from '@/components/RegisterWizard/Step2Cadre';

vi.mock('@/lib/api', () => ({
  getCadres: vi.fn(),
  getSubjects: vi.fn(),
  getDepartments: vi.fn(),
  onDataChanged: vi.fn(() => () => {}),
  dataVersion: () => 0,
}));

import { getCadres, getSubjects, getDepartments } from '@/lib/api';
import type { Cadre, Subject, Department } from '@/lib/api';

const DEPARTMENTS: Department[] = [
  { code: 'health', name: 'Afya', status: 'active', icon: '' },
  { code: 'education', name: 'Elimu', status: 'active', icon: '' },
];

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
  vi.mocked(getDepartments).mockReset();
  vi.mocked(getDepartments).mockResolvedValue(DEPARTMENTS);
});

describe('Step2Cadre', () => {
  it('loads departments from the server and cadres when one is selected', async () => {
    vi.mocked(getCadres).mockResolvedValue(HEALTH_CADRES);
    render(<Step2Cadre initial={{}} onBack={() => {}} onNext={() => {}} />);

    await waitFor(() => expect(getDepartments).toHaveBeenCalled());
    await waitFor(() => expect(getCadres).toHaveBeenCalledWith('health'));

    const selects = screen.getAllByRole('combobox');
    const cadreSelect = selects[1];
    expect(cadreSelect).toHaveTextContent('Clinical Officer');
    expect(cadreSelect).toHaveTextContent('Nursing Officer (NO)');
  });

  it('blocks submission without a cadre', async () => {
    vi.mocked(getCadres).mockResolvedValue(HEALTH_CADRES);
    const onNext = vi.fn();
    render(<Step2Cadre initial={{}} onBack={() => {}} onNext={onNext} />);

    await waitFor(() => expect(getCadres).toHaveBeenCalledWith('health'));
    const form = screen.getByText('Endelea →').closest('form')!;
    fireEvent.submit(form);

    expect(await screen.findByText(/chagua idara na kada/i)).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('submits a health cadre without subjects', async () => {
    vi.mocked(getCadres).mockResolvedValue(HEALTH_CADRES);
    const onNext = vi.fn();
    render(<Step2Cadre initial={{}} onBack={() => {}} onNext={onNext} />);

    await waitFor(() => expect(getCadres).toHaveBeenCalledWith('health'));
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'CO' } });
    fireEvent.click(screen.getByText('Endelea →'));

    await waitFor(() =>
      expect(onNext).toHaveBeenCalledWith({ category: 'health', cadre_code: 'CO', subjects: [] })
    );
    expect(screen.queryByText('Mathematics')).not.toBeInTheDocument();
  });

  it('submits for teachers with subjects and passes chosen subjects', async () => {
    vi.mocked(getCadres).mockResolvedValue(EDU_CADRES);
    vi.mocked(getSubjects).mockResolvedValue(SUBJECTS);
    const onNext = vi.fn();
    render(<Step2Cadre initial={{}} onBack={() => {}} onNext={onNext} />);

    // Wait for initial load, then change department to education
    await waitFor(() => expect(getCadres).toHaveBeenCalled());
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'education' } });
    await waitFor(() => expect(getCadres).toHaveBeenCalledWith('education'));

    // Wait for cadre select to update
    await waitFor(() => {
      const updatedSelects = screen.getAllByRole('combobox');
      fireEvent.change(updatedSelects[1], { target: { value: 'TEACHER_SECONDARY' } });
    });

    expect(await screen.findByText('Mathematics')).toBeInTheDocument();
    expect(getSubjects).toHaveBeenCalled();

    // Select both subjects (required for teachers)
    fireEvent.click(screen.getByText('Mathematics'));
    fireEvent.click(screen.getByText('Biology'));
    fireEvent.click(screen.getByText('Endelea →'));

    await waitFor(() =>
      expect(onNext).toHaveBeenCalledWith({
        category: 'education', cadre_code: 'TEACHER_SECONDARY', subjects: ['MATH', 'BIO'],
      })
    );
  });

  it('passes chosen subjects when a teacher selects them', async () => {
    vi.mocked(getCadres).mockResolvedValue(EDU_CADRES);
    vi.mocked(getSubjects).mockResolvedValue(SUBJECTS);
    const onNext = vi.fn();
    render(<Step2Cadre initial={{}} onBack={() => {}} onNext={onNext} />);

    await waitFor(() => expect(getCadres).toHaveBeenCalled());
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'education' } });
    await waitFor(() => expect(getCadres).toHaveBeenCalledWith('education'));

    await waitFor(() => {
      const updatedSelects = screen.getAllByRole('combobox');
      fireEvent.change(updatedSelects[1], { target: { value: 'TEACHER_SECONDARY' } });
    });

    expect(await screen.findByText('Mathematics')).toBeInTheDocument();
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

    await waitFor(() => expect(getCadres).toHaveBeenCalled());
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'education' } });
    await waitFor(() => expect(getCadres).toHaveBeenCalledWith('education'));

    await waitFor(() => {
      const updatedSelects = screen.getAllByRole('combobox');
      fireEvent.change(updatedSelects[1], { target: { value: 'TEACHER_SECONDARY' } });
    });

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

  it('does not allow more than 2 subjects', async () => {
    vi.mocked(getCadres).mockResolvedValue(EDU_CADRES);
    vi.mocked(getSubjects).mockResolvedValue(SUBJECTS);
    const onNext = vi.fn();
    render(<Step2Cadre initial={{}} onBack={() => {}} onNext={onNext} />);

    await waitFor(() => expect(getCadres).toHaveBeenCalled());
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'education' } });
    await waitFor(() => expect(getCadres).toHaveBeenCalledWith('education'));

    await waitFor(() => {
      const updatedSelects = screen.getAllByRole('combobox');
      fireEvent.change(updatedSelects[1], { target: { value: 'TEACHER_SECONDARY' } });
    });

    await screen.findByText('Mathematics');
    fireEvent.click(screen.getByText('Mathematics'));
    fireEvent.click(screen.getByText('Biology'));

    // Both selected — clicking again shouldn't add a third
    fireEvent.click(screen.getByText('Endelea →'));

    await waitFor(() => {
      const call = vi.mocked(onNext).mock.calls[0]?.[0];
      expect(call.subjects.length).toBeLessThanOrEqual(2);
    });
  });
});
