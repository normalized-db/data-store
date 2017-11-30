export interface IdbConfig {
  name: string;
  version: number;
  upgrade?: (UpgradeDB) => void;
}
