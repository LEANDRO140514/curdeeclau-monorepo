# TERMINAL ENCODING RUNBOOK

> Tipo: procedural/runbook
> Version: 1.0.0
> Proposito: Diagnosticar y reparar encoding UTF-8 en terminales de desarrollo.

---

## 1. PROPOSITO

Este runbook documenta como garantizar que el texto con caracteres Unicode (tildes, enies, simbolos) se copie y pegue correctamente desde y hacia terminales de desarrollo en el ecosistema CURDEECLAU.

El problema tipico: copias texto de Claude Code y al pegarlo en otro lado aparecen caracteres rotos (a, A3 en vez de o, caracteres basura en vez de box-drawing).

---

## 2. CUANDO USARLO

Cuando un agente o desarrollador detecte:

- Caracteres rotos al copiar texto desde la terminal.
- Caracteres rotos al pegar texto en la terminal.
- `chcp` muestra basura en vez de "P agina de c odigos activa: 65001".
- Box-drawing characters (recuadros, tablas) se renderizan como letras extranas.
- Acentos y enies aparecen como dos caracteres (ej: "a" en vez de "o").

---

## 3. DIAGNOSTICO RAPIDO

Ejecutar en PowerShell:

```powershell
# 1. Code page actual
chcp

# 2. Encoding de consola
[Console]::OutputEncoding.WebName
[Console]::InputEncoding.WebName

# 3. Profile cargado
$PROFILE
Test-Path $PROFILE
```

Interpretacion:

| Sintoma | Causa probable | Solucion |
|---------|---------------|----------|
| `chcp` no es 65001 | Code page no es UTF-8 | Paso 4.1 |
| `OutputEncoding` no es UTF-8 | PowerShell encoding incorrecto | Paso 4.2 |
| `$PROFILE` no existe | Sin profile de PowerShell | Paso 4.3 |
| Renderizado correcto pero copy/paste roto | VS Code terminal integrada sin encoding configurado | Paso 4.4 |
| Box-drawing roto incluso con encoding correcto | Fuente sin soporte Unicode | Paso 4.5 |

---

## 4. SOLUCION

### 4.1 Code page del sistema

```powershell
chcp 65001
```

Pero esto solo afecta la sesion actual. Para que sea permanente, continuar con los pasos siguientes.

### 4.2 Encoding de consola PowerShell

```powershell
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
```

### 4.3 Perfil de PowerShell (persistente)

Crear o editar `$PROFILE` con el contenido del paso 4.2.

Si el perfil apunta a OneDrive y falla, usar la ruta estandar:

```
C:\Users\<usuario>\Documents\PowerShell\Microsoft.PowerShell_profile.ps1
```

### 4.4 VS Code terminal integrada

En `settings.json` de VS Code:

```json
"terminal.integrated.copyOnSelection": true,
"terminal.integrated.shellIntegration.encoding": "utf-8",
"files.encoding": "utf8",
"files.autoGuessEncoding": false
```

### 4.5 Fuente con soporte Unicode

La fuente `Lucida Console` (default en Windows) no soporta box-drawing characters. Instalar una fuente moderna:

```
winget install Microsoft.CascadiaCode
```

Luego en VS Code settings.json:

```json
"terminal.integrated.fontFamily": "Cascadia Code"
```

---

## 5. VERIFICACION

Despues de aplicar la solucion, reiniciar la terminal y ejecutar:

```powershell
# Debe decir 65001 sin basura
chcp

# Debe decir utf-8
[Console]::OutputEncoding.WebName

# Probar caracteres problematicos
Write-Host "Espanol: a e i o u n u"
Write-Host "Simbolos: - - ' ' (c) (r) TM EUR"
```

Seleccionar el texto de salida. Pegar en un editor externo. Debe verse identico.

---

## 6. ANTI-PATTERNS

- Asumir que el problema es de "la app que pega" sin verificar encoding de origen.
- Cambiar la code page del sistema completo sin entender el impacto.
- Usar fuentes propietarias que no estan disponibles en todos los equipos del equipo.
- Ignorar el problema porque "solo afecta a los acentos" (los logs, eventos, y documentacion institucional usan Unicode).

---

*Fin del Terminal Encoding Runbook v1.0.0*
