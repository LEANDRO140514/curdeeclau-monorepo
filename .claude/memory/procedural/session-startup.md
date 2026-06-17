# SESSION STARTUP CHECKLIST

> Tipo: procedural
> Version: 1.1.0
> Creado: 2026-06-14
> Actualizado: 2026-06-16 — Reforzado Paso 2 con evidencia de fallo en GOV-0
> Proposito: Checklist obligatorio que todo agente debe ejecutar al iniciar sesion en CURDEECLAU.

---

## 1. PROPOSITO

Este checklist garantiza que cada sesion de desarrollo comience con el entorno correctamente configurado. Los agentes deben ejecutar estos pasos antes de cualquier trabajo productivo.

---

## 2. CHECKLIST OBLIGATORIO

### Paso 1: Lectura institucional

Leer en orden:

- [ ] `.claude/memory/MEMORY.md`
- [ ] `.claude/memory/institutional/constitucion.md`
- [ ] `.claude/memory/institutional/principios.md`
- [ ] `.claude/memory/operational/estado-actual.md`

### Paso 2: Encoding de terminal (CRITICO — NO SALTAR)

**El error persistente #1 en CURDEECLAU.** `chcp 65001` por sí solo NO basta en PowerShell 7 en Windows. Sin las 3 líneas de `[Console]` y `$OutputEncoding`, el output por stdout se corrompe aunque el código de página sea 65001.

Ejecutar en PowerShell (obligatorio, incluso si `chcp` ya dice 65001):

```powershell
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
```

Verificar con caracteres reales (no solo `chcp`):

```powershell
Write-Host "Verificación: Pekín, Constitución, inmunológico, Jerarquía, ADN, Ñoño"
# Si ves caracteres rotos (â, Ã³, A±) en vez de tildes y eñes, el encoding NO está corregido.
# Repetir las 3 líneas de arriba y volver a verificar.
```

**Referencia:** `procedural/runbooks/terminal-encoding.md`

**Nota técnica:** `$PSDefaultParameterValues` es opcional y puede dar errores en algunas versiones de pwsh. Las 3 líneas de arriba son el mínimo indispensable y suficiente.

### Paso 3: Verificar encoding en output

Antes de escribir cualquier contenido, verificar que los caracteres Unicode se renderizan correctamente:

```
Español: á é í ó ú ñ ü
Símbolos: — – « »
Box-drawing: ─ │ ┌ ┐ └ ┘ ├ ┤
```

Si aparecen caracteres rotos (ej: `Ã³` en vez de `ó`, `â”` en vez de `─`), regresar al Paso 2.

---

## 3. REGLA DE ORO

**NUNCA escribir contenido sin verificar el encoding del terminal primero.**

Esto aplica especialmente a:
- Fichas DNA y naturalizacion (usan tildes, enies, box-drawing)
- Documentos institucionales (MEMORY.md, constitucion, principios)
- Tests (nombres de tests en espanol)
- Cualquier archivo .md en `.claude/memory/`

---

## 4. ANTI-PATTERNS DE SESION

- Leer MEMORY.md y saltarse la verificacion de encoding. **← Fallo GOV-0: la tabla de entregables se vio corrupta.**
- Asumir que `chcp 65001` es suficiente sin setear `[Console]::OutputEncoding`.
- Escribir archivos UTF-8 sin verificar que la terminal los renderiza bien.
- Asumir que "la sesion anterior funciono, esta tambien".
- Ignorar caracteres rotos en el output de `chcp` o `Write-Host`.

---

*Fin del Session Startup Checklist v1.0.0*
