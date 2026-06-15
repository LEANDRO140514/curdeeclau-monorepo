# Universidad Latino — Next Steps

> Tipo: vertical/demo
> Version: 1.0.0
> Creado: 2026-06-14
> Fase: UV-CLOSE

---

## A. ACTIVACION REAL MINIMA (UV-LIVE)

**Requisito previo:** Autorizacion explicita del responsable de CURDEECLAU.

1. Configurar variables de entorno:
   - `LLM_PROVIDER_API_KEY`
   - `GHL_API_KEY`
   - `GHL_LOCATION_ID`
   - `DATABASE_URL`

2. Ejecutar demo en modo live:
   ```bash
   npx tsx src/demo/universidad-latino/runAdmissionsDemo.ts --live
   ```

3. Validar:
   - [ ] Contacto real creado en GHL.
   - [ ] No se crearon duplicados en GHL.
   - [ ] No se crearon duplicados en Postgres.
   - [ ] Tags aplicados correctamente en GHL.
   - [ ] Custom fields poblados (carrera, horario, nivel, canal).
   - [ ] Pipeline stage: "Nuevo prospecto".

4. Revisar:
   - [ ] Pipeline de GHL configurado con las 7 etapas definidas en UV-0.
   - [ ] Custom fields creados en GHL (carrera_interes, horario_deseado, nivel_interes, canal_origen, pregunta_inicial).
   - [ ] Usuario de prueba en GHL con acceso al pipeline.

---

## B. COMERCIAL

1. **Presentar demo a Universidad Latino.**
   - Usar `demo-script.md` como guion.
   - Usar `PRESENTATION_NOTES.md` para objeciones.
   - Modo mock si no hay credenciales. Modo live si estan configuradas.

2. **Obtener feedback del cliente:**
   - [ ] Confirmar carreras reales (las 10 de UV-0 son placeholders).
   - [ ] Confirmar costos reales por carrera y modalidad.
   - [ ] Confirmar horarios reales.
   - [ ] Confirmar requisitos de inscripcion.
   - [ ] Confirmar RVOE y validez oficial.
   - [ ] Confirmar responsable de seguimiento (quien recibe los leads en GHL).
   - [ ] Confirmar pipeline GHL real del cliente.
   - [ ] Confirmar si tienen Meta Business para WhatsApp.

3. **Definir siguiente paso comercial:**
   - [ ] Prueba piloto (2 semanas, 1 carrera).
   - [ ] Integracion completa (todas las carreras).
   - [ ] Solo informacion (el cliente quiere pensar).

---

## C. TECNICO FUTURO

### C.1 WhatsApp productivo
- Activar YCloud WhatsApp Business API.
- Configurar webhook en algoritmo-core-engine.
- Probar flujo completo WhatsApp → asistente → captura → GHL.
- **Requisito:** Meta Business approval.

### C.2 PWA / Portal de admisiones
- Crear app en `apps/` con interfaz de chat web.
- Embeder en landing page de Universidad Latino.
- Metricas basicas de conversion.

### C.3 Dashboard
- Metricas de leads capturados por carrera, canal, horario.
- Tasa de conversion por etapa del pipeline.
- Tiempo medio de primera respuesta.
- Costo por lead (tokens LLM).

### C.4 RAG / Knowledge Engine
- Migrar conocimiento de archivos .md a vector store.
- Implementar recuperacion semantica para preguntas no cubiertas en FAQ.
- Mantener fail-closed (no inventar).

### C.5 Calendario / Agendamiento
- Integrar Google Calendar o GHL Appointments.
- Permitir agendar visita al campus o llamada con asesor.
- Confirmacion automatica.

### C.6 Automatizaciones GHL
- Disparar campanas de seguimiento en GHL.
- Recordatorios automaticos a prospectos que no responden.
- Nurturing pre-inscripcion.

### C.7 Analitica avanzada
- Costo de adquisicion por lead (CAC).
- ROI por canal de origen.
- Prediccion de conversion.

---

## D. LO QUE NO DEBE HACERSE TODAVIA

1. **No crear PWA** sin confirmacion del cliente.
2. **No crear portal de alumnos** (es un producto diferente).
3. **No crear sistema escolar** (es un producto diferente).
4. **No implementar pagos** (requiere integracion financiera y compliance).
5. **No migrar el asistente a produccion** sin prueba piloto.
6. **No escalar a multiples universidades** sin validar el modelo con una.
7. **No hacer push al remote** sin autorizacion explicita.
8. **No gastar tokens reales de LLM** sin autorizacion.
9. **No exponer el asistente a prospectos reales** sin supervision.

---

*Fin de los Next Steps v1.0.0*
