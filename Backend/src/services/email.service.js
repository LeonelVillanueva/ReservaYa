/**
 * Servicio de envío de correos usando SMTP (Gmail)
 */

const nodemailer = require('nodemailer');
const config = require('../config');

// Crear transporter reutilizable
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true para 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Genera una plantilla HTML básica, limpia, para reducir riesgo de SPAM
 */
function buildBasicTemplate({ title, intro, content, footer }) {
  return `
  <!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding:24px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                  <h1 style="margin:0;font-size:20px;line-height:1.3;color:#111827;">${title}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px;font-size:14px;line-height:1.6;color:#374151;">
                  <p style="margin:0 0 12px 0;">${intro}</p>
                  ${content}
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.5;color:#6b7280;">
                  ${footer}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

/**
 * Envía un correo genérico
 * @param {Object} options
 * @param {string|string[]} options.to - Destinatario(s)
 * @param {string} options.subject - Asunto
 * @param {string} [options.text] - Cuerpo en texto plano
 * @param {string} [options.html] - Cuerpo en HTML
 */
async function enviarCorreo({ to, subject, text, html }) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'Sistema de Reservas';

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text,
    html,
  });

  if (config.isDev) {
    console.log('[email.service] Mensaje enviado:', info.messageId);
  }

  return info;
}

/**
 * Ejemplo: correo de prueba para diagnóstico
 */
async function enviarCorreoPrueba(to) {
  const subject = 'Prueba SMTP - Sistema de Reservas';
  const text = 'Este es un correo de prueba enviado desde el backend.';
  const html = buildBasicTemplate({
    title: 'Prueba de correo',
    intro: 'Este es un correo de prueba enviado desde el backend.',
    content: '<p>Si ves este mensaje, la configuración SMTP funciona correctamente.</p>',
    footer: '<p>Por favor, no respondas a este mensaje.</p>',
  });

  return enviarCorreo({ to, subject, text, html });
}

/**
 * Correo de verificación (código de 6 caracteres)
 */
async function enviarCorreoVerificacion({ to, nombre, codigo }) {
  const subject = 'Verifica tu correo - ReservaYa';
  const safeNombre = nombre || 'cliente';
  const text = `Hola ${safeNombre},\n\nTu código de verificación es: ${codigo}\n\nIngresa este código en la aplicación para activar tu cuenta. El código expira en 24 horas.\n\nSi no solicitaste este registro, ignora este correo.`;
  const html = buildBasicTemplate({
    title: 'Verifica tu correo',
    intro: `Hola ${safeNombre},`,
    content: `
      <p>Tu código de verificación es:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px;margin:16px 0;">${codigo}</p>
      <p>Ingresa este código en la aplicación para activar tu cuenta. El código expira en 24 horas.</p>
      <p>Si no solicitaste este registro, ignora este correo.</p>
    `,
    footer: '<p>Este es un correo automático. No respondas a este mensaje.</p>',
  });

  return enviarCorreo({ to, subject, text, html });
}

/**
 * Correo de bienvenida al registrarse (después de verificar)
 */
async function enviarCorreoBienvenida({ to, nombre }) {
  const subject = 'Bienvenido a ReservaYa';
  const safeNombre = nombre || 'cliente';
  const text = `Hola ${safeNombre},\n\nBienvenido a ReservaYa. Tu cuenta ha sido verificada correctamente.\n\nGracias por registrarte.`;
  const html = buildBasicTemplate({
    title: 'Bienvenido a ReservaYa',
    intro: `Hola ${safeNombre},`,
    content: `
      <p>Tu cuenta ha sido verificada. A partir de ahora podrás gestionar tus reservas de forma rápida y segura.</p>
      <p>Te recomendamos mantener tus datos actualizados y usar tu usuario para iniciar sesión.</p>
    `,
    footer: '<p>Este es un correo automático. Si no reconoces este registro, simplemente ignóralo.</p>',
  });

  return enviarCorreo({ to, subject, text, html });
}

module.exports = {
  enviarCorreo,
  enviarCorreoPrueba,
  enviarCorreoVerificacion,
  enviarCorreoBienvenida,
};
