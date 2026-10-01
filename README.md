# strideRide

Aplicación web responsive hecha con React.

## Asistente y entrenos

El asistente usa Gemini y datos de Intervals.icu; no envía datos de Strava a la IA.
Puede consultar entrenamientos y proponer una sesión individual de carrera,
trail, bici, natación o fuerza. Los planes de varias semanas y la edición de
eventos existentes todavía no están disponibles.

La propuesta muestra fecha, deporte y pasos antes de publicarla. Solo el botón
**Confirmar y publicar** crea el evento en Intervals.icu; responder en el chat no
lo confirma. **Descartar** no modifica el calendario.

Las propuestas se guardan en memoria durante 30 minutos y se pierden al reiniciar
el servidor. Si una publicación tiene un resultado incierto, se bloquean sus
reintentos: revisa primero Intervals.icu para evitar duplicados. Las confirmaciones
repetidas de la misma propuesta no crean otro evento mientras siga disponible.

La llegada a Garmin depende de tener activa la sincronización de entrenos en
Intervals.icu, su ventana de envío y la compatibilidad del dispositivo. Guardar
el evento no confirma su entrega al reloj o Edge. Natación y fuerza pueden tener
limitaciones en los pasos exportados.

`npm.cmd test` ejecuta las pruebas con datos ficticios, sin consultar Gemini ni
modificar calendarios reales. `npm.cmd run dev` inicia la aplicación local.
