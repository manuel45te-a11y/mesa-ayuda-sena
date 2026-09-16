# 6. Cómo repartir el trabajo entre Claude, ChatGPT y Gemini

El proyecto lo haces tú solo, pero con tres asistentes. Para que sumen en vez de estorbarse,
cada uno tiene un territorio.

## 6.1 Territorios

| Asistente | Se encarga de | No debería tocar |
|---|---|---|
| **Claude Code** | El código y la máquina: SQL, pantallas, correr la app, corregir errores, Git, despliegue. También el capítulo técnico del documento | La redacción larga del documento formal |
| **ChatGPT** | La versión maestra del documento escrito, el cronograma, las actas y el ensayo de la sustentación | El código del proyecto |
| **Gemini** | Leer el PDF de la guía de aprendizaje y extraer criterios de evaluación; diapositivas y diagramas conceptuales | El código del proyecto |

**Regla única e importante:** el código lo edita un solo asistente. Si ChatGPT o Gemini te
dan código, tráelo como sugerencia y que se integre desde aquí. Tres asistentes editando
archivos que no ven completos terminan en imports rotos y versiones que no compilan.

Lo mismo con el documento: que ChatGPT tenga el archivo maestro. Los demás le pasan insumos,
no versiones paralelas.

---

## 6.2 Prompts listos para copiar

### Para Gemini · extraer los criterios de evaluación

> Te adjunto la guía de aprendizaje / formato de proyecto formativo del SENA.
> Extrae en una tabla: (1) cada evidencia que se exige, (2) el criterio de evaluación
> asociado tal como está redactado, (3) la fase del proyecto a la que pertenece y (4) la
> fecha o semana de entrega si aparece.
> No resumas ni interpretes: transcribe los criterios literalmente. Si algo no está en el
> documento, escribe "no especificado".

### Para ChatGPT · redactar el documento

> Estoy desarrollando un proyecto formativo del SENA: un sistema de mesa de ayuda para
> reportar y atender fallas técnicas de los ambientes de formación, hecho en React Native
> (Expo) con Supabase. Trabajo solo.
> Te paso el borrador del planteamiento del problema, la justificación y los objetivos.
> Necesito que lo conviertas en texto formal académico, en tercera persona, sin adjetivos
> promocionales, conservando la estructura de secciones. Marca con [VERIFICAR] cualquier
> dato que yo deba confirmar con mi centro de formación.
> No inventes cifras, nombres de instituciones ni referencias bibliográficas.

### Para ChatGPT · preparar la sustentación

> Voy a sustentar este proyecto ante un jurado de instructores del SENA. Te paso el resumen
> técnico.
> Hazme 15 preguntas que probablemente me harán, ordenadas de la más probable a la menos, y
> señala en cuáles mi respuesta actual es débil. Incluye preguntas incómodas del tipo
> "¿por qué no usó una herramienta que ya existe?" y "¿qué pasa si se cae el internet?".

### Para mí (Claude Code) · seguir el desarrollo

> Necesito agregar [módulo]. Revisa el esquema en supabase/schema.sql y las pantallas
> existentes, y hazlo siguiendo las mismas convenciones. Después córrelo y muéstrame que
> funciona.

---

## 6.3 Qué NO delegar en ninguna IA

1. **Los datos de tu centro de formación.** Nombre del centro, número de ficha, nombre del
   instructor, cantidad de ambientes: eso lo confirmas tú. Una IA que "rellena" esos datos
   te mete un error que el jurado detecta de inmediato.
2. **Las referencias bibliográficas.** Los modelos inventan referencias que parecen reales.
   Cada cita que uses, ábrela y verifícala.
3. **Entender tu propio código.** Si no puedes explicar por qué usaste RLS en vez de filtrar
   desde la aplicación, la sustentación se cae. Pregunta hasta entenderlo.
4. **La decisión de qué entregar.** Los criterios los pone tu instructor, no el asistente.

---

## 6.4 Orden sugerido de trabajo

| Semana | Qué hacer | Con quién |
|---|---|---|
| 1 | Extraer los criterios exactos de la guía y armar la lista de entregables | Gemini |
| 1 | Crear el proyecto en Supabase, ejecutar el esquema y correr la app | Claude Code |
| 2 | Ajustar ambientes y categorías con los datos reales del centro | Solo |
| 2 | Redactar planteamiento, justificación y objetivos | ChatGPT |
| 3 | Diagramas ER y de casos de uso exportados como imagen | Claude Code + mermaid.live |
| 3-4 | Módulos pendientes: adjuntar fotos, administración de catálogos | Claude Code |
| 5 | Ejecutar el plan de pruebas y capturar evidencias | Solo |
| 5 | Desplegar la versión web y dejar el enlace en el documento | Claude Code |
| 6 | Armar diapositivas y ensayar la sustentación | Gemini + ChatGPT |
