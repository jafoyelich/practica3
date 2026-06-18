# TODO - ms-notification (sale.created -> Email + WhatsApp)

- [x] Step 1: Crear estructura de carpetas y archivos dentro de `src/` (module, consumer, service, dto, interfaces, providers, repository).
- [x] Step 2: Actualizar `package.json` con dependencias necesarias (amqplib, nodemailer, uuid, etc.).

- [x] Step 3: Implementar Supabase repository para insertar en `notification_db.registros_notificacion`.
- [x] Step 4: Implementar EmailService con Nodemailer + HTML template.
- [x] Step 5: Implementar WhatsAppProvider (Twilio + Meta) e interfaz + WhatsAppService seleccionable por env.
- [x] Step 6: Implementar NotificationService con reglas de manejo de errores (Email falla -> continuar; WhatsApp falla -> registrar sin afectar Email; ambos -> registrar ambos; nunca tirar excepción para RabbitMQ).
- [x] Step 7: Implementar NotificationConsumer RabbitMQ con ack manual, validación de DTO, reintentos y manejo de errores.
- [x] Step 8: Implementar `notification.module.ts` e integrar en `app.module.ts`.
- [ ] Step 9: Asegurar compilación TypeScript (strict) y tipado estricto.
- [ ] Step 10: Agregar ejemplos de unit tests básicos.
- [ ] Step 11: Ejecutar `npm install`, `npm run build` y `npm test`.


