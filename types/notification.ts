export type NotificationType =
  | "login"
  | "logout"
  | "timesheet"
  | "todo"
  | "version"
  | "system"
  | "error"
  | "success"
  | "info"
  | "warning";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}
