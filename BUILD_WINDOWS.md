# Windows build and pilot distribution

The desktop edition is built only from the `desktop-white-label-foundation` branch while it is under development.

## GitHub Actions build

Workflow: `.github/workflows/desktop-windows-build.yml`

The workflow builds on `windows-latest` with Node 22, Rust stable, Vite and Tauri 2.

Expected artifacts:

1. `GestaoBarbearia-Windows-Portable`
   - `GestaoBarbearia.exe`
   - `portable.flag`
   - `LEIA-ME.txt`
   - on first run the application creates `barbershop-data/` beside the executable.

2. `GestaoBarbearia-Windows-Setup`
   - NSIS Windows installer (`.exe`).

3. `GestaoBarbearia-Windows-MSI`
   - MSI Windows installer (`.msi`).

## Portable pilot rule

The portable copy must remain in one writable folder. When `portable.flag` is beside the executable, the program stores the database and writable business files under `barbershop-data/` beside the application.

Do not remove a USB drive while the program is open. Create a backup before formatting, replacing or moving the storage device.

## Installed mode

The installer does not place the live business database inside the application installation directory. Without `portable.flag`, writable business data is stored in the Windows application-data location resolved by Tauri.

This lets future program updates replace binaries without replacing the local `barbershop.db`.

## Before calling a build stable

A Windows pilot build must pass:

- application starts without internet;
- first-run white-label setup persists after restart;
- client/service/product/staff creation persists after restart;
- appointment conflict checks work;
- finalizing an appointment creates one Cash entry only;
- collaborator commission snapshot remains unchanged after percentage edits;
- product sale reduces stock and records commission when a collaborator is selected;
- manual historical Cash entries appear in Reports;
- backup is created and integrity-check passes;
- restore creates a pre-restore safety backup and reloads data;
- portable mode writes only under the portable data root;
- installed mode writes under Windows application data.

Until those checks pass on a real Windows build, artifacts are considered pilot/test builds, not a production release.
