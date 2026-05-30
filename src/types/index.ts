export interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
  createdAt: string;
  workspace?: Workspace | null;
}

export interface Item {
  id: string;
  name: string;
  grade: "D" | "C" | "B" | "A" | "S" | "COMMON";
  createdAt: string;
  updatedAt: string;
}

export interface DropItem {
  id: string;
  dropId: string;
  itemId: string | null;
  itemName: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
}

export interface DropParticipant {
  id: string;
  dropId: string;
  userId: string;
  paymentStatus: "PENDING" | "PAID";
  paidAt: string | null;
  paidById: string | null;
  user: {
    id: string;
    name: string;
  };
  paidBy?: {
    id: string;
    name: string;
  } | null;
}

export interface Drop {
  id: string;
  title: string;
  type: "FARM" | "BOSS" | "PRIME";
  dropDate: string;
  totalValue: number;
  notes?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  items: DropItem[];
  participants: DropParticipant[];
  createdBy: {
    id: string;
    name: string;
  };
  splitValue?: number;
}

export interface PaginatedDrops {
  data: Drop[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardOverview {
  totalValue: number;
  totalDrops: number;
  dayWithHighestValue: {
    date: string;
    value: number;
  } | null;
  topItem: {
    itemName: string;
    totalQuantity: number;
  } | null;
  dropsByDay: { date: string; count: number }[];
  valueByDay: { date: string; value: number }[];
  itemsRanking: {
    itemName: string;
    totalQuantity: number;
    totalValue: number;
  }[];
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  changes: Record<string, any> | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MemberBalance {
  userId: string;
  name: string;
  totalPending: number;
  drops: {
    dropId: string;
    dropTitle: string;
    participantId: string;
    splitValue: number;
  }[];
}
