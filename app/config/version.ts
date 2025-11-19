import { CHANGELOG } from "./changelog";

// Automatically get the latest version from CHANGELOG
export const VERSION = CHANGELOG[0].version;
