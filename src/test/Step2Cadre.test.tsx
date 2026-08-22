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

    // Select TEACHER_SECONDARY cadre
    await waitFor(() => {
      const updatedSelects = screen.getAllByRole('combobox');
      fireEvent.change(updatedSelects[1], { target: { value: 'TEACHER_SECONDARY' } });
    });

    // Wait for subject selects to appear
    await waitFor(() => {
      const allSelects = screen.getAllByRole('combobox');
      expect(allSelects.length).toBeGreaterThanOrEqual(3); // dept + cadre + subject1 + subject2
    });

    expect(getSubjects).toHaveBeenCalled();

    // Select both subjects via dropdowns
    const allSelects = screen.getAllByRole('combobox');
    const subjectSelect1 = allSelects[2]; // somo la kwanza
    const subjectSelect2 = allSelects[3]; // somo la pili
    fireEvent.change(subjectSelect1, { target: { value: 'MATH' } });
    fireEvent.change(subjectSelect2, { target: { value: 'BIO' } });
    fireEvent.click(screen.getByText('Endelea →'));

    await waitFor(() =>
      expect(onNext).toHaveBeenCalledWith({
        category: 'education', cadre_code: 'TEACHER_SECONDARY', subjects: ['MATH', 'BIO'],
      })
    );
  });

  it('passes chosen subjects when a teacher selects one subject', async () => {
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

    // Wait for subject selects
    await waitFor(() => {
      const allSelects = screen.getAllByRole('combobox');
      expect(allSelects.length).toBeGreaterThanOrEqual(3);
    });

    // Select only one subject
    const allSelects = screen.getAllByRole('combobox');
    fireEvent.change(allSelects[2], { target: { value: 'MATH' } });
    fireEvent.click(screen.getByText('Endelea →'));

    await waitFor(() =>
      expect(onNext).toHaveBeenCalledWith({
        category: 'education', cadre_code: 'TEACHER_SECONDARY', subjects: ['MATH'],
      })
    );
  });

  it('allows selecting two subjects via dropdowns', async () => {
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

    // Wait for subject selects
    await waitFor(() => {
      const allSelects = screen.getAllByRole('combobox');
      expect(allSelects.length).toBeGreaterThanOrEqual(3);
    });

    const allSelects = screen.getAllByRole('combobox');
    fireEvent.change(allSelects[2], { target: { value: 'MATH' } });
    fireEvent.change(allSelects[3], { target: { value: 'BIO' } });
    fireEvent.click(screen.getByText('Endelea →'));

    await waitFor(() => {
      const call = vi.mocked(onNext).mock.calls[0]?.[0];
      expect(call.subjects).toEqual(['MATH', 'BIO']);
    });
  });

  it('shows selected subject count', async () => {
    vi.mocked(getCadres).mockResolvedValue(EDU_CADRES);
    vi.mocked(getSubjects).mockResolvedValue(SUBJECTS);
    render(<Step2Cadre initial={{}} onBack={() => {}} onNext={() => {}} />);

    await waitFor(() => expect(getCadres).toHaveBeenCalled());
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'education' } });
    await waitFor(() => expect(getCadres).toHaveBeenCalledWith('education'));

    await waitFor(() => {
      const updatedSelects = screen.getAllByRole('combobox');
      fireEvent.change(updatedSelects[1], { target: { value: 'TEACHER_SECONDARY' } });
    });

    // Wait for subject selects
    await waitFor(() => {
      const allSelects = screen.getAllByRole('combobox');
      expect(allSelects.length).toBeGreaterThanOrEqual(3);
    });

    const allSelects = screen.getAllByRole('combobox');
    fireEvent.change(allSelects[2], { target: { value: 'MATH' } });
    expect(await screen.findByText(/Umepata: 1 somo/)).toBeInTheDocument();

    fireEvent.change(allSelects[3], { target: { value: 'BIO' } });
    expect(await screen.findByText(/Umepata: 2 somo/)).toBeInTheDocument();
  });
});
