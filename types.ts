export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum Status {
  NOT_STARTED = 'Not started',
  IN_PROGRESS = 'In progress',
  COMPLETED = 'Completed'
}

export interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  bucketId: string;
  priority: Priority;
  status: Status;
  dueDate?: string;
  startDate?: string;
  assignee?: string;
  labels: string[];
  percentComplete?: number;
  predecessors?: string[];
  effort?: number;
  actualEffort?: number; // Added for logging actual hours
  timesheet?: Record<string, number>; // Date string (YYYY-MM-DD) -> Hours
  allocation?: number;
  checklist?: ChecklistItem[];
  isMilestone?: boolean;
  parentId?: string;
}

export interface Bucket {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface ScopeChange {
  id: string;
  date: string;
  title: string;
  description: string;
  impact: string; // e.g., "+5 days", "$10k cost"
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string; // ISO string
  mentions?: string[]; // List of user IDs or names mentioned
  isActionItem?: boolean;
  actionStatus?: 'Open' | 'Solved';
  responsibility?: string;
  targetDate?: string;
  replies?: Comment[];
}

export interface ActionItem {
  id: string;
  title: string;
  owner?: string;
  dueDate?: string;
  status: 'Open' | 'Done';
  sourceCommentId?: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';
export type RiskStatus = 'Open' | 'Mitigated' | 'Closed';

export interface Risk {
  id: string;
  creationDate?: string; // Date
  description: string;
  cause?: string;
  effects?: string;
  category1?: string;
  category2?: 'Scope / Design' | 'Functions / Timeline' | 'Resource';
  mitigationMeasure?: string; // made optional
  responsibility?: string;
  targetDate?: string; // Date
  completionDate?: string; // Date
  status: 'Open' | 'Mitigated' | 'Closed';
  comments?: string;
  probability?: 'Low' | 'Medium' | 'High';
  impact?: 'Low' | 'Medium' | 'High';
  owner?: string; // Added to fix lint
  mitigationAction?: string; // Added to fix lint
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  manager: string;
  sponsor?: string;
  requestor?: string;
  startDate: string;
  dueDate: string;
  expectedStartDate?: string;
  expectedEndDate?: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  buckets: Bucket[];
  tasks: Task[];
  // Map of PersonName -> TeamID -> Role (R/A/C/I)
  raci?: Record<string, Record<string, 'R' | 'A' | 'C' | 'I' | ''>>;
  scope?: string;
  scopeChanges?: ScopeChange[];
  discussions?: Comment[];
  risks?: Risk[];
  actionItems?: ActionItem[];
  isTemplate?: boolean;
  businessUnit?: string;
  currentUpdate?: string;
  previousUpdates?: string;
  priority?: 'Low' | 'Medium' | 'High';
  skillset?: string[];
  attachments?: string[];
}

export interface Person {
  id: string;
  name: string;
  role: string;
  team: string;
  manager: string;
  joinDate: string;
  resignDate?: string;
  email: string;
  status: 'Active' | 'Resigned' | 'On Leave';
}

export interface ProjectData {
  buckets: Bucket[];
  tasks: Task[];
}

export type ViewMode = 'overview' | 'grid' | 'board' | 'timeline' | 'charts' | 'people' | 'settings';