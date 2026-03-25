export const MEMBER_STATUSES = ['on_my_way', 'here', 'running_late'] as const;

export const STATUS_LABELS: Record<(typeof MEMBER_STATUSES)[number], string> = {
  on_my_way: 'On My Way',
  here: 'Here',
  running_late: 'Running Late',
};
