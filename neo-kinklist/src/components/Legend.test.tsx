import React from 'react';
import { render, screen } from '@testing-library/react';
import Legend from './Legend';
import { KinklistProvider } from '../context/KinklistContext';

describe('Legend Component', () => {
  test('renders all level definitions', () => {
    render(
      <KinklistProvider initialKinksText={''}>
        <Legend />
      </KinklistProvider>
    );
    
    // Überprüft, ob die Legende-Überschrift gerendert wird
    expect(screen.getByText('Legende:')).toBeInTheDocument();
    
    // Überprüft, ob die Standard-Level-Namen gerendert werden
    expect(screen.getByText('Favorit')).toBeInTheDocument();
    expect(screen.getByText('Mag ich')).toBeInTheDocument();
    expect(screen.getByText('Okay')).toBeInTheDocument();
    expect(screen.getByText('Vielleicht')).toBeInTheDocument();
    expect(screen.getByText('Nein')).toBeInTheDocument();
  });
});
