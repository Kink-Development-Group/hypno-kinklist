import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  test('renders main app elements', () => {
    render(<App />);
    
    // Überprüft, ob die wichtigsten Elemente der App gerendert werden
    expect(screen.getByText(/Kinklist/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });
});
