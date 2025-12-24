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
    // Only show toast if not silent
    if (!options?.silent) {
      notificationService.showToast("success", `Welcome back, ${displayName}!`);
    }
  } else {
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
      notificationService.showToast("success", "Entry added successfully");
      break;
    case "update":
      notificationService.showToast("success", "Entry updated successfully");
      break;
    case "delete":
      notificationService.showToast("success", "Entry deleted successfully");
      break;
  }
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
    notificationService.showToast("success", `Version ${versionNumber} created`);
  } else {
    notificationService.showToast("success", `Version ${versionNumber} updated`);
  }
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
