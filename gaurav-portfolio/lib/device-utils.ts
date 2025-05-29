import { UAParser } from "ua-parser-js";

export type DeviceInfo = {
  browser: string;
  os: string;
  deviceType: "mobile" | "tablet" | "desktop" | "unknown";
};

export function getDeviceInfo(): DeviceInfo {
  const parser = new UAParser();
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown";
  const os = result.os.name || "Unknown";
  const type = result.device.type || "desktop";

  return {
    browser,
    os,
    deviceType: (type as DeviceInfo["deviceType"]) || "unknown",
  };
}
