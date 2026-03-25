export const MEMBER_ROLES = ['host', 'mod', 'member'] as const;

export const ROLE_LABELS: Record<(typeof MEMBER_ROLES)[number], string> = {
  host: 'Host',
  mod: 'Mod',
  member: 'Member',
};
