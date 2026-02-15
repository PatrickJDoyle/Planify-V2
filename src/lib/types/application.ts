export interface Application {
  applicationId: number;
  objectid?: number;
  id?: number;
  planningAuthority: string;
  developmentDescription: string;
  developmentAddress: string;
  applicationStatus: string;
  applicationType?: string;
  decision?: string | null;
  landUseCode?: string;
  areaOfSite?: number;
  numResidentialUnits?: number;
  oneOffHouse?: string;
  floorArea?: number;
  receivedDate: string | null;
  decisionDate?: string | null;
  decisionDueDate?: string;
  appealDecisionDate?: string | null;
  appealSubmittedDate?: string | null;
  expiryDate?: string;
  fiRecDate?: string;
  fiRequestDate?: string;
  grantDate?: string;
  withdrawnDate?: string;
  etlDate?: string;
  appealRefNumber?: string;
  appealStatus?: string;
  appealDecision?: string | null;
  matchedKeywords: string[];
  applicationNumber: string;
  linkApplicationDetails?: string;
  oneOffKPI?: string;
  siteId?: string;
  origFid?: number;
  latitude: number;
  longitude: number;
  // Enriched fields from backend
  displayStatus?: string;
  statusCategory?: string;
  statusEmoji?: string;
  displayDecision?: string;
  decisionCategory?: string;
  decisionEmoji?: string;
  displayApplicationType?: string;
  applicationTypeCategory?: string;
  applicationTypeEmoji?: string;
  formattedDescription?: string;
  formattedAddress?: string;
  submissionDeadline?: {
    deadlineDate: string | null;
    daysRemaining: number | null;
    isWithinDeadline: boolean;
  };
  distanceKm?: number;
}

export interface Update {
  applicationId: number;
  fieldName: string;
  oldValue: string;
  newValue: string;
  application: Application;
}
