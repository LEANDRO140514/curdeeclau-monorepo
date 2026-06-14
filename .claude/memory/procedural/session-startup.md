# SESSION STARTUP CHECKLIST

> Tipo: procedural
> Version: 1.0.0
> Creado: 2026-06-14
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

### Paso 2: Encoding de terminal (CRITICO)

Ejecutar en PowerShell:

```powershell
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
```

Verificar:

```powershell
chcp
# Debe mostrar: Pagina de codigos activa: 65001
```

**Referencia:** `procedural/runbooks/terminal-encoding.md`

### Paso 3: Verificar encoding en output

Antes de escribir cualquier contenido, verificar que los caracteres Unicode se renderizan correctamente:

```
Espanol: a e i o u n u
Simbolos: - - ' '
Box-drawing: -
```

Si aparecen caracteres rotos (ej: `a` en vez de `o`, `A3` en vez de caracteres box), repetir Paso 2.

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

- Leer MEMORY.md y saltarse la verificacion de encoding.
- Escribir archivos UTF-8 sin verificar que la terminal los renderiza bien.
- Asumir que "la sesion anterior funciono, esta tambien".
- Ignorar caracteres rotos en el output de `chcp` o `Write-Host`.

---

*Fin del Session Startup Checklist v1.0.0*
