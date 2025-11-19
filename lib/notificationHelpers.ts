"use client";

import { NotificationType } from "@/types/notification";

interface NotificationService {
  createNotification: (input: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) => Promise<void>;
  showToast: (type: NotificationType, message: string, title?: string) => void;
}

let notificationService: NotificationService | null = null;

export function setNotificationService(service: NotificationService) {
  notificationService = service;
}

export async function createAuthNotification(
  type: "login" | "logout", 
  user: any,
  options?: { silent?: boolean }
) {
  if (!notificationService) return;

  const displayName = user?.displayName || user?.email || "User";
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (type === "login") {
    await notificationService.createNotification({
      type: "login",
      title: "Login Successful",
      message: `${displayName} logged in at ${timestamp}`,
      data: { userId: user?.uid, email: user?.email },
    });
    
    // Only show toast if not silent
    if (!options?.silent) {
      notificationService.showToast("success", `Welcome back, ${displayName}!`);
    }
  } else {
    await notificationService.createNotification({
      type: "logout",
      title: "Logged Out",
      message: `${displayName} logged out at ${timestamp}`,
      data: { userId: user?.uid, email: user?.email },
    });
    
    if (!options?.silent) {
      notificationService.showToast("info", "You have been logged out");
    }
  }
}

export async function createTimesheetNotification(action: "add" | "update" | "delete", data?: any) {
  if (!notificationService) return;

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  let title = "";
  let message = "";

  switch (action) {
    case "add":
      title = "Timesheet Entry Added";
      message = `New time log entry created at ${timestamp}`;
      notificationService.showToast("success", "Entry added successfully");
      break;
    case "update":
      title = "Timesheet Entry Updated";
      message = `Time log entry updated at ${timestamp}`;
      notificationService.showToast("success", "Entry updated successfully");
      break;
    case "delete":
      title = "Timesheet Entry Deleted";
      message = `Time log entry deleted at ${timestamp}`;
      notificationService.showToast("success", "Entry deleted successfully");
      break;
  }

  await notificationService.createNotification({
    type: "timesheet",
    title,
    message,
    data: data || {},
  });
}

export async function createVersionNotification(
  action: "create" | "update",
  versionNumber?: string
) {
  if (!notificationService) return;

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  let title = "";
  let message = "";

  if (action === "create") {
    title = "New Version Created";
    message = `Version ${versionNumber} created at ${timestamp}`;
    notificationService.showToast("success", `Version ${versionNumber} created`);
  } else {
    title = "Version Updated";
    message = `Version ${versionNumber} updated at ${timestamp}`;
    notificationService.showToast("success", `Version ${versionNumber} updated`);
  }

  await notificationService.createNotification({
    type: "version",
    title,
    message,
    data: { versionNumber },
  });
}

export async function createErrorNotification(error: string, context?: string) {
  if (!notificationService) return;

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  await notificationService.createNotification({
    type: "error",
    title: context ? `Error: ${context}` : "Error Occurred",
    message: `${error} at ${timestamp}`,
    data: { error, context },
  });

  notificationService.showToast("error", error, context);
}
