import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { createQueryClient } from '@evolveiq/api-client';
import { AuthProvider } from '@evolveiq/auth';
import { familyAudienceOf, type FamilyAudience } from '../family-audience';
import { SignInScreen } from './SignInScreen';

function renderSignIn(audience: FamilyAudience, otherUrl?: string) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter>
        <AuthProvider>
          <SignInScreen audience={audience} otherUrl={otherUrl} />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// Client request, 20 Nov 2026: parents at family.evolviq.in, children at student.evolviq.in.
describe('Family sign-in, per audience', () => {
  it('asks a child only for their student ID and PIN, and points a parent to their own site', () => {
    renderSignIn('students', 'https://family.evolviq.in');
    expect(screen.getByLabelText('Student ID')).toBeInTheDocument();
    expect(screen.getByLabelText('PIN')).toBeInTheDocument();
    expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: 'Who is signing in' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in at family.evolviq.in' })).toHaveAttribute('href', 'https://family.evolviq.in');
  });

  it('asks a parent only for their email and password, and points a child to theirs', () => {
    renderSignIn('parents', 'https://student.evolviq.in');
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.queryByLabelText('Student ID')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Student' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in at student.evolviq.in' })).toHaveAttribute('href', 'https://student.evolviq.in');
  });

  it('keeps both on one screen when the build is for both', () => {
    renderSignIn('both');
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Student' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Sign in at/ })).not.toBeInTheDocument();
  });

  it('reads the build setting, and anything else means both', () => {
    expect(familyAudienceOf('parents')).toBe('parents');
    expect(familyAudienceOf('students')).toBe('students');
    expect(familyAudienceOf(undefined)).toBe('both');
    expect(familyAudienceOf('teachers')).toBe('both');
  });
});
