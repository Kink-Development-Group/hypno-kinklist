# CI/CD Deployment Setup

## Übersicht

Die CI/CD-Pipeline wurde für bessere Stabilität und separate Umgebungen überarbeitet.

## Benötigte GitHub Secrets

Bitte fügen Sie folgende Secrets in den GitHub Repository Settings hinzu:

### Bestehende Secrets (bereits konfiguriert)

- `SFTP_HOST` - SFTP Server Hostname
- `SFTP_PORT` - SFTP Server Port (normalerweise 22)
- `SFTP_USER` - SFTP Benutzername
- `SFTP_PASS` - SFTP Passwort

### Neue Secrets (müssen hinzugefügt werden)

- `SFTP_REMOTE_DIR_PROD` - Produktions-Verzeichnis (z.B. `/var/www/html/kinklist_hypno`)
- `SFTP_REMOTE_DIR_DEV` - Development-Verzeichnis (z.B. `/var/www/html/kinklist_hypno_dev`)

## Deployment-Environments

### Production (main branch)

- **Branch**: `main`
- **Target**: `${{ secrets.SFTP_REMOTE_DIR_PROD }}`
- **Workflow**: Automatisches Deployment bei Push auf main
- **URL**: Produktions-Website

### Development (dev branch)

- **Branch**: `dev`
- **Target**: `${{ secrets.SFTP_REMOTE_DIR_DEV }}`
- **Workflow**: Automatisches Deployment bei Push auf dev
- **URL**: Test-Website für Development

## Workflow-Dateien

### 1. `.github/workflows/deploy-sftp.yml`

- **Zweck**: Build und Deployment für main und dev branches
- **Trigger**: Push auf main oder dev
- **Features**:
  - Tests vor Deployment
  - Automatische Verzeichniserstellung
  - Berechtigungsmanagement
  - Branch-spezifische Deployment-Ziele

### 2. `.github/workflows/test.yml`

- **Zweck**: Tests und Linting für Pull Requests
- **Trigger**: Pull Requests und Pushes auf andere Branches
- **Features**:
  - Linting (falls konfiguriert)
  - Unit Tests
  - Build-Validierung

## Deployment-Skript

### `scripts/deploy.sh`

- Validiert Build-Artefakte
- Erstellt Deployment-Manifest
- Umgebungsspezifische Konfiguration

## Fehlerbehebung der ursprünglichen Pipeline

### Problem

```bash
drone-scp error: ssh: command mkdir -p *** failed
```

### Lösung

1. **SSH-Pre-Action**: Explizite Verzeichniserstellung via SSH
2. **Berechtigungen**: Automatische Berechtigung-Setzung
3. **Strip Components**: Korrekte Verzeichnisstruktur
4. **Overwrite/Clean**: Überschreibung und Bereinigung alter Dateien

### Verbesserte Features

- ✅ Robuste Verzeichniserstellung
- ✅ Automatische Berechtigungseinstellung
- ✅ Test-Integration
- ✅ Branch-spezifische Deployments
- ✅ Deployment-Validierung
- ✅ Cleanup und Rollback-Unterstützung

## Lokale Entwicklung

### Tests ausführen

```bash
npm test
```

### Build erstellen

```bash
npm run build
```

### Deployment testen (lokal)

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh dev
```

## Nächste Schritte

1. **Secrets hinzufügen** in GitHub Repository Settings
2. **Dev-Branch erstellen** falls noch nicht vorhanden
3. **Pipeline testen** mit einem Push auf dev
4. **Produktions-Deployment** über main branch

## Monitoring

Die Pipeline erstellt ein `deployment-info.json` File für jedes Deployment mit:

- Timestamp
- Environment
- Branch/Commit Info
- Build-Verzeichnis
- Ziel-Verzeichnis
