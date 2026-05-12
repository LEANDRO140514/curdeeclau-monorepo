# Alertmanager — Prima Donna WA

Configuración de enrutamiento para alertas generadas por Prometheus a partir de `infra/observability/prometheus/alerts.yaml`.

## Qué hace

- **Agrupa** notificaciones por `alertname`, `severity`, `category`, `tenant_id`.
- **Espera** `group_wait: 30s` antes del primer envío del grupo.
- **Re-notifica** grupos cada `group_interval: 5m` si siguen disparados; repite el aviso cada `repeat_interval: 3h`.
- **`tenant_id="_global"`** (p. ej. `NoTraffic`): va a **slack-platform** (`#alerts-platform`), separado de warnings por tenant.
- **`severity=critical`** (resto): Slack **slack-critical** y **email-critical** (`continue: true` en la primera subruta).
- **`severity=warning`** (por tenant): Slack **slack-warning** (receiver por defecto).
- **Receiver `null`:** descarta envíos (webhook a puerto cerrado); útil para pruebas si enrutas temporalmente a él (ver abajo).
- **Inhibición:** si hay **critical** con el mismo `alertname`, `tenant_id` y `category` que una **warning**, la warning se suprime.
- **`send_resolved: true`** en Slack (warning, critical, platform) y en email critical, para ver recuperación en canal y buzón.

Plantillas: `templates/notifications.tmpl` (severity, category, alertname, tenant_id, summary, description, runbook).

## Variables en `alertmanager.yml`

| Variable | Uso |
|----------|-----|
| `ALERTMANAGER_SLACK_PLATFORM_WEBHOOK` | Slack alertas `_global` / plataforma |
| `ALERTMANAGER_SLACK_WARNING_WEBHOOK` | Slack warning por tenant |
| `ALERTMANAGER_SLACK_CRITICAL_WEBHOOK` | Slack critical |
| `ALERTMANAGER_SMARTHOST` | SMTP `host:puerto` |
| `ALERTMANAGER_EMAIL_FROM` | From |
| `ALERTMANAGER_EMAIL_TO` | Email critical |
| `ALERTMANAGER_EMAIL_AUTH_USERNAME` | Usuario SMTP |
| `ALERTMANAGER_EMAIL_AUTH_PASSWORD` | Contraseña / API key SMTP |

Copia `.env.example` → `.env`, rellena, y desde este directorio (Git Bash / WSL / Linux):

```bash
set -a && source .env && set +a
envsubst < alertmanager.yml > alertmanager.resolved.yml
alertmanager --config.file=alertmanager.resolved.yml
```

En **PowerShell** no hay `envsubst` nativo: reemplaza `${...}` a mano, usa WSL, o script propio.

Ajusta `channel:` (`#alerts-platform`, `#alerts-warning`, `#alerts-critical`) a tus canales.

## Receiver `null` (pruebas)

- Definido como `webhook_configs` hacia `127.0.0.1:9` (nada escucha): Alertmanager registrará fallos de entrega; la alerta sigue gestionada en la UI.
- **Uso:** en una copia de trabajo, cambia temporalmente `route.receiver` a `null` o añade una subruta de prueba con `receiver: null`.
- **Alternativa sin ruido en logs:** dejar rutas reales y usar **Silences** en la UI de Alertmanager.

## Arranque local (Alertmanager)

**Binario:**

```bash
alertmanager --config.file=alertmanager.resolved.yml --storage.path=/tmp/am
```

**Docker (ejemplo):**

```bash
docker run -d --name alertmanager -p 9093:9093 \
  -v "$PWD/alertmanager.resolved.yml:/etc/alertmanager/alertmanager.yml:ro" \
  -v "$PWD/templates:/etc/alertmanager/templates:ro" \
  -w /etc/alertmanager \
  prom/alertmanager:latest \
  --config.file=/etc/alertmanager/alertmanager.yml \
  --storage.path=/alertmanager
```

El proceso debe ver `templates/*.tmpl` (working dir o rutas absolutas en `templates:` del YAML).

## Conectar Prometheus con Alertmanager

En `prometheus.yml`:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ["localhost:9093"]
```

Reinicia Prometheus. En **Status → Alertmanagers** debe aparecer el target OK.

## Checklist final antes de producción

1. **`prometheus.yml`:** bloque `alerting.alertmanagers` apunta al host/puerto reales del Alertmanager.
2. **`alertmanager.resolved.yml`:** generado con `envsubst` (o equivalente); sin `${...}` sin expandir; webhooks y SMTP rellenados.
3. **Plantillas:** arrancar Alertmanager con `alertmanager.resolved.yml` y comprobar en log que no hay error al cargar `templates/*.tmpl` (o `amtool config routes show --config.file=...` si usas amtool).
4. **Prueba manual:** disparar una alerta de prueba en staging (regla temporal, métrica forzada o `amtool alert add` con labels mínimos: `alertname`, `severity`, `category`, `tenant_id`) y comprobar recepción en Slack/email según severidad.
5. **Inhibición:** con misma `alertname`, `tenant_id` y `category`, tener **critical** firing y **warning** firing; la warning no debe notificarse (solo critical). Comprobar en UI de AM “inhibited by”.

## Probar una alerta

- **amtool** (mismo binario que Alertmanager): ver documentación `amtool alert add`.
- **Silences** en la UI para cortar ruido mientras depuras.

## Secrets — buenas prácticas

- No commitear `.env` ni `alertmanager.resolved.yml` con secretos.
- Kubernetes: Secrets + volumen o External Secrets; `envsubst` en initContainer o Helm.
- Rotar webhooks Slack si se filtran.
- SMTP: API keys / contraseñas de aplicación, no cuentas personales.
- Restringir acceso a `#alerts-critical` y a `ALERTMANAGER_EMAIL_TO`.

## Extender

- Rutas por `category` o más `matchers`.
- PagerDuty / Opsgenie: nuevos `receivers` y rutas.
- Si en el futuro hay **critical** con `tenant_id=_global` y debe ir también a email, añade subrutas explícitas (`continue: true` en la ruta `_global` y luego matchers `severity=critical`).
