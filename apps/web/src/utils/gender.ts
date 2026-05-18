export function getHeroLabel(gender: 'male' | 'female'): string {
  return gender === 'female' ? 'heroína' : 'héroe';
}

export function getHeroLabelCapitalized(gender: 'male' | 'female'): string {
  const label = getHeroLabel(gender);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getWelcomeLabel(gender: 'male' | 'female'): string {
  return gender === 'female' ? 'Bienvenida' : 'Bienvenido';
}

export function getForgedLabel(gender: 'male' | 'female'): string {
  return gender === 'female' ? 'SIDO FORJADA' : 'SIDO FORJADO';
}
