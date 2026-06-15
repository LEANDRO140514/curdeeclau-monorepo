# Demo Script — Universidad Latino AI Admissions

> Tipo: vertical/demo
> Version: 1.0.0
> Creado: 2026-06-14
> Audiencia: Directivos comerciales de Universidad Latino

---

## Objetivo de la demo

Demostrar que Universidad Latino puede:

1. Atender prospectos 24/7 con un asistente IA conversacional.
2. Capturar datos completos del prospecto en una conversacion natural.
3. Sincronizar automaticamente cada lead con GHL para seguimiento comercial.
4. Reducir el tiempo entre consulta y primer contacto del asesor a segundos.

---

## Historia del prospecto (narracion comercial)

> Maria es una joven de 22 anos que trabaja en una oficina por las mananas.
> Vio un anuncio de Universidad Latino en Facebook y le intereso la carrera de Derecho.
> Son las 10 PM y el departamento de admisiones esta cerrado.
> Maria envia un mensaje por WhatsApp preguntando por la carrera.

> En menos de 3 minutos, el asistente IA le responde, resuelve sus dudas,
> recolecta sus datos, y los deja listos en GHL para que un asesor la contacte
> al dia siguiente. Maria no tuvo que esperar. Universidad Latino no perdio el lead.

---

## Conversacion de ejemplo

```
[ 0s] PROSPECTO: Hola, me interesa la carrera de Derecho.

[ 1s] ASISTENTE: Hola, soy el asistente virtual de admisiones de Universidad
       Latino. Excelente eleccion. Derecho es una de nuestras carreras mas
       demandadas, con modalidades Matutino, Vespertino y Sabatino.
       Para darte mas informacion, cual es tu nombre completo?

[15s] PROSPECTO: Maria Garcia Lopez

[16s] ASISTENTE: Gracias Maria. Cual es tu numero de telefono con codigo de
       pais? Por ejemplo: +52 123 456 7890

[30s] PROSPECTO: +521234567890

[31s] ASISTENTE: Perfecto. En que horario te gustaria estudiar?
       Tenemos Matutino, Vespertino, Sabatino y Online.

[42s] PROSPECTO: Matutino, porque trabajo en las tardes.

[43s] ASISTENTE: Entendido. El horario Matutino es ideal para quienes trabajan.
       Por ultimo, por que medio nos contactaste? WhatsApp, Web, Telefono,
       Facebook o Instagram?

[55s] PROSPECTO: Por WhatsApp

[56s] ASISTENTE: Dejame confirmar tus datos:
       - Nombre: Maria Garcia Lopez
       - Telefono: +521234567890
       - Carrera: Derecho
       - Horario: Matutino
       - Contacto via: WhatsApp

       Es correcta la informacion?

[65s] PROSPECTO: Si, correcto

[66s] ASISTENTE: Tus datos han sido registrados correctamente. Un asesor de
       admisiones se pondra en contacto contigo para dar seguimiento a tu
       interes en Derecho. Muchas gracias por confiar en Universidad Latino.

[FIN — Duracion total: ~70 segundos]
```

---

## Datos capturados

| Campo | Valor |
|-------|-------|
| Nombre | Maria Garcia Lopez |
| Telefono | +521234567890 |
| Carrera | Derecho |
| Horario | Matutino |
| Canal | WhatsApp |
| Nivel de interes | ALTO (inferido) |

---

## Resultado esperado

1. Lead creado en persistencia local.
2. Contacto creado en GHL con:
   - Nombre, telefono, tags (universidad-latino, admisiones, uv-1, canal:whatsapp, carrera:derecho, interes:alto, horario:matutino).
   - Custom fields: carrera_interes, nivel_interes, canal_origen, horario_deseado.
   - Pipeline: Nuevo prospecto.
3. Equipo de admisiones recibe notificacion en GHL.
4. Asesor retoma el lead al dia siguiente.

---

## Explicacion comercial para directivos

### Que estan viendo

Un asistente de IA que:

- **Atiende en segundos**, 24/7, sin horario de oficina.
- **Habla como un humano**, no como un robot con respuestas genericas.
- **Recolecta datos completos** sin que el prospecto sienta que esta llenando un formulario.
- **Entrega el lead directamente en GHL**, el CRM que ya usan.
- **No reemplaza a los asesores** — los potencia. El asesor recibe un lead calificado con todos los datos, listo para seguimiento.

### Retorno de inversion estimado (conceptual)

| Metrica | Sin asistente | Con asistente |
|---------|---------------|---------------|
| Tiempo de primera respuesta | 4-12 horas (horario de oficina) | < 5 segundos |
| Leads capturados fuera de horario | 0 (se pierden) | 100% (el asistente siempre esta activo) |
| Datos completos del lead | Depende del asesor | 100% (el asistente recolecta los 5 campos) |
| Tiempo del asesor por lead | 15-20 min (preguntas basicas + captura) | 2-5 min (solo seguimiento) |

---

## Que se esta demostrando

- Flujo completo funcional: conversacion → captura → GHL → pipeline.
- Arquitectura abierta: el LLM, el CRM y el canal son intercambiables.
- Conocimiento controlado: el asistente no inventa carreras, costos ni requisitos.
- Velocidad comercial: lead calificado en GHL en menos de 2 minutos.

---

## Que NO se esta demostrando todavia

- Multi-idioma (solo espanol en esta fase).
- Canal WhatsApp productivo (requiere Meta Business approval).
- Pagos, inscripcion completa, portal de alumnos.
- Dashboard de metricas y conversion.
- Integracion con sistema escolar.

---

## Preguntas frecuentes de directivos (con respuestas)

**Q: El asistente va a reemplazar a mi equipo de admisiones?**
A: No. El asistente hace el trabajo repetitivo (responder preguntas frecuentes, capturar datos). El equipo humano hace el trabajo de valor (seguimiento personalizado, cierre de inscripcion, atencion a padres).

**Q: Que pasa si el asistente dice algo incorrecto?**
A: El asistente solo responde con informacion aprobada en su base de conocimiento. Si no tiene la respuesta, deriva a un asesor humano. No inventa.

**Q: Podemos cambiar las carreras, costos, requisitos?**
A: Si. La base de conocimiento es un archivo de texto versionado que ustedes pueden actualizar. Sin programar.

**Q: Funciona con WhatsApp?**
A: Si. CURDEECLAU ya tiene integracion con WhatsApp via YCloud. Requiere la aprobacion de Meta Business.

**Q: Cuanto cuesta?**
A: [A definir con el cliente. Costo de infraestructura LLM + licencia de la plataforma.]

---

*Fin del demo script v1.0.0*
