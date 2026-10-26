export type JobCategory =
  | 'HOME_REPAIRS' | 'CLEANING'   | 'CHILDCARE' | 'TUTORING'
  | 'PET_CARE'     | 'TRANSPORT'  | 'TECH_HELP' | 'COOKING'
  | 'FITNESS'      | 'MOVING'     | 'GARDEN'    | 'CREATIVE'
  | 'ERRANDS'      | 'OTHER';

export type JobType    = 'ONE_TIME' | 'RECURRING' | 'PART_TIME' | 'FULL_TIME';
export type PayType    = 'HOURLY'   | 'FIXED'     | 'NEGOTIABLE'| 'VOLUNTEER';
export type JobStatus  = 'OPEN'     | 'FILLED'    | 'CLOSED'    | 'EXPIRED';

export interface Job {
  id:                   number;
  posterId:             number;
  posterName:           string;
  posterFlat?:          string;
  title:                string;
  description:          string;
  category:             JobCategory;
  jobType:              JobType;
  payType:              PayType;
  payAmount?:           number;
  location?:            string;
  status:               JobStatus;
  applicationCount:     number;
  hasApplied:           boolean;
  myApplicationStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  communityId:          number;
  createdAt:            string;
  expiresAt?:           string;
}

export interface JobApplication {
  id:             number;
  jobId:          number;
  applicantId:    number;
  applicantName:  string;
  applicantFlat?: string;
  coverMessage:   string;
  status:         'PENDING' | 'ACCEPTED' | 'REJECTED';
  appliedAt:      string;
}

export interface CreateJobPayload {
  title:       string;
  description: string;
  category:    JobCategory;
  jobType:     JobType;
  payType:     PayType;
  payAmount?:  number;
  location?:   string;
  expiresAt?:  string;
  showFlat:    boolean;
}

export interface PageResponse<T> {
  content:       T[];
  page:          number;
  size:          number;
  totalElements: number;
  totalPages:    number;
}
