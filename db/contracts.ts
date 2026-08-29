import type { BusinessConfig } from "../core/business-config";

export type IntegrityCheckResult = {
  ok: boolean;
  message: string;
};

export type BackupResult = {
  path: string;
  createdAt: string;
};

export interface DesktopDatabaseGateway {
  initialize(): Promise<void>;
  getSchemaVersion(): Promise<number>;
  getBusinessConfig(): Promise<BusinessConfig | null>;
  saveBusinessConfig(config: BusinessConfig): Promise<void>;
  integrityCheck(): Promise<IntegrityCheckResult>;
  createBackup(destinationDirectory?: string): Promise<BackupResult>;
  restoreBackup(backupPath: string): Promise<void>;
  close(): Promise<void>;
}

export const DESKTOP_SCHEMA_VERSION = 1;
