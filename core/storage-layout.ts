export type DesktopStorageMode = "portable" | "installed";

export type DesktopStorageLayout = {
  root: string;
  dataDir: string;
  databaseFile: string;
  configDir: string;
  configFile: string;
  backupsDir: string;
  logsDir: string;
  assetsDir: string;
};

function join(root: string, child: string) {
  const cleanRoot = root.replace(/[\\/]+$/, "");
  const cleanChild = child.replace(/^[\\/]+/, "");
  return `${cleanRoot}/${cleanChild}`;
}

export function createStorageLayout(root: string): DesktopStorageLayout {
  const dataDir = join(root, "data");
  const configDir = join(root, "config");
  return {
    root,
    dataDir,
    databaseFile: join(dataDir, "barbershop.db"),
    configDir,
    configFile: join(configDir, "business.json"),
    backupsDir: join(root, "backups"),
    logsDir: join(root, "logs"),
    assetsDir: join(root, "assets"),
  };
}

export function storageModeDescription(mode: DesktopStorageMode) {
  return mode === "portable"
    ? "Dados ficam ao lado do executável e podem viajar com o pendrive."
    : "Dados ficam na pasta de aplicativo do Windows e independem da pasta de instalação.";
}
