export const SESSION_MODES = ['drive', 'walk', 'hang'] as const;

export const MODE_LABELS: Record<(typeof SESSION_MODES)[number], string> = {
  drive: 'Drive',
  walk: 'Walk',
  hang: 'Hang',
};

export const MODE_DESCRIPTIONS: Record<(typeof SESSION_MODES)[number], string> = {
  drive: 'Optimized for driving. Large buttons, fast updates.',
  walk: 'For groups moving on foot. Moderate updates.',
  hang: 'For gathering at a spot. Low battery usage.',
};
