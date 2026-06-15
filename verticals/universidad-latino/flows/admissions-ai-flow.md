# Admissions AI Flow

> Tipo: vertical/flows
> Version: 1.0.0
> Creado: 2026-06-14

---

## Flujo conversacional UV-2

```
[INICIO]
   |
   v
[GREETING]
   - Saludo inicial: "Hola, soy el asistente virtual de admisiones
     de Universidad Latino. Cuentame, que carrera te interesa?"
   |
   v
[COLLECTING] ←────────────────────┐
   - Preguntar por dato faltante   │
   - Validar respuesta             │
   - Almacenar dato recolectado    │
   - Si responde FAQ, contestar    │
   |                               │
   v                               │
[CHECK COMPLETENESS]               │
   - Verificar 5 campos requeridos │
   |                               │
   ├── Faltan datos → [COLLECTING] ┘
   |
   v
[CONFIRMING]
   - Mostrar resumen de datos recolectados
   - Preguntar si son correctos
   |
   ├── Usuario corrige → [COLLECTING]
   |
   v
[CAPTURING]
   - Construir LeadCapturePayload
   - Llamar LeadCaptureService.capture()
   |
   ├── Error → [ERROR]
   |
   v
[DONE]
   - Mensaje final de confirmacion
   - "Un asesor de admisiones se pondra en contacto contigo
      para dar seguimiento a tu solicitud. Muchas gracias."
   |
   v
[FIN]
```

## Estados

| Estado | Descripcion | Accion |
|--------|-------------|--------|
| GREETING | Inicio de conversacion | Saludar, preguntar carrera de interes |
| COLLECTING | Recolectando datos faltantes | Solicitar siguiente campo, responder FAQs |
| CONFIRMING | Verificando datos con usuario | Mostrar resumen, esperar confirmacion |
| CAPTURING | Enviando a LeadCaptureService | Llamar capture(), manejar resultado |
| DONE | Conversacion finalizada | Mensaje de despedida |
| ERROR | Error en captura | Informar al usuario, ofrecer reintento |

---

*Fin del Admissions AI Flow v1.0.0*
