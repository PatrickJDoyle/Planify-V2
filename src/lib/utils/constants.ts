export const PLANNING_AUTHORITIES = [
  { id: 'Carlow County Council', name: 'Carlow County Council' },
  { id: 'Cavan County Council', name: 'Cavan County Council' },
  { id: 'Clare County Council', name: 'Clare County Council' },
  { id: 'Cork City Council', name: 'Cork City Council' },
  { id: 'Cork County Council', name: 'Cork County Council' },
  { id: 'Donegal County Council', name: 'Donegal County Council' },
  { id: 'Dublin City Council', name: 'Dublin City Council' },
  { id: 'Dún Laoghaire-Rathdown County Council', name: 'Dún Laoghaire-Rathdown County Council' },
  { id: 'Fingal County Council', name: 'Fingal County Council' },
  { id: 'Galway City Council', name: 'Galway City Council' },
  { id: 'Galway County Council', name: 'Galway County Council' },
  { id: 'Kerry County Council', name: 'Kerry County Council' },
  { id: 'Kildare County Council', name: 'Kildare County Council' },
  { id: 'Kilkenny County Council', name: 'Kilkenny County Council' },
  { id: 'Laois County Council', name: 'Laois County Council' },
  { id: 'Leitrim County Council', name: 'Leitrim County Council' },
  { id: 'Limerick City and County Council', name: 'Limerick City and County Council' },
  { id: 'Longford County Council', name: 'Longford County Council' },
  { id: 'Louth County Council', name: 'Louth County Council' },
  { id: 'Mayo County Council', name: 'Mayo County Council' },
  { id: 'Meath County Council', name: 'Meath County Council' },
  { id: 'Monaghan County Council', name: 'Monaghan County Council' },
  { id: 'Offaly County Council', name: 'Offaly County Council' },
  { id: 'Roscommon County Council', name: 'Roscommon County Council' },
  { id: 'Sligo County Council', name: 'Sligo County Council' },
  { id: 'South Dublin County Council', name: 'South Dublin County Council' },
  { id: 'Tipperary County Council', name: 'Tipperary County Council' },
  { id: 'Waterford City and County Council', name: 'Waterford City and County Council' },
  { id: 'Westmeath County Council', name: 'Westmeath County Council' },
  { id: 'Wexford County Council', name: 'Wexford County Council' },
  { id: 'Wicklow County Council', name: 'Wicklow County Council' },
] as const;

export const SECTORS = [
  { id: 'residential', name: 'Residential' },
  { id: 'commercial', name: 'Commercial' },
  { id: 'industrial', name: 'Industrial' },
  { id: 'agricultural', name: 'Agricultural' },
  { id: 'community', name: 'Community' },
  { id: 'energy', name: 'Energy' },
  { id: 'communication', name: 'Communication' },
  { id: 'consumer', name: 'Consumer' },
  { id: 'data_centres', name: 'Data Centres' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'education', name: 'Education' },
  { id: 'transport', name: 'Transport' },
  { id: 'tourism', name: 'Tourism' },
] as const;

export const APPLICATION_TYPES = [
  { id: 'Permission', name: 'Permission' },
  { id: 'Retention', name: 'Retention' },
  { id: 'Outline', name: 'Outline Permission' },
  { id: 'Extension', name: 'Extension of Duration' },
  { id: 'Exemption', name: 'Exemption' },
  { id: 'Part 8', name: 'Part 8' },
  { id: 'Approval', name: 'Approval' },
] as const;

export const SORT_OPTIONS = [
  { id: 'received_newest', name: 'Newest First' },
  { id: 'decision_due_soonest', name: 'Decision Due Soonest' },
  { id: 'decision_made_newest', name: 'Decision Made Newest' },
  { id: 'distance_nearest', name: 'Nearest First' },
  { id: 'distance_farthest', name: 'Furthest First' },
] as const;

export const DECISION_CATEGORIES = {
  approved: ['GRANT', 'CONDITIONAL', 'UNCONDITIONAL', 'APPROVAL', 'DECLARED EXEMPT'],
  refused: ['REFUSED', 'INVALID', 'WITHDRAWN', 'DECISION QUASHED', 'DECLARED NOT EXEMPT', 'CANNOT BE CONSIDERED'],
} as const;
