const axios = require('axios');
const nodemailer = require('nodemailer');
const prisma = require('./db');

/**
 * Sends a message via Telegram Bot API
 */
const sendTelegram = async (token, chatId, text) => {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });
    return true;
  } catch (error) {
    console.error('Telegram Notification Error:', error.response?.data || error.message);
    return false;
  }
};

/**
 * Sends an email via SMTP (configured for Gmail by default)
 */
const sendEmail = async (config, to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.pass, // App Password
      },
    });

    await transporter.sendMail({
      from: `"NetGuard AI" <${config.user}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email Notification Error:', error.message);
    return false;
  }
};

/**
 * Main function called when an alert is created
 */
const processAlertNotification = async (alert) => {
  try {
    // 1. Fetch current settings
    const settingsRaw = await prisma.systemSetting.findMany();
    const settings = settingsRaw.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    // 2. Check global toggle
    if (settings.notificationsEnabled !== 'true') return;

    // 3. Determine if alert severity warrants a notification
    const severity = alert.severity.toLowerCase();
    const shouldNotify = 
      (severity === 'critical' && settings.notifyCritical === 'true') ||
      (severity === 'high' && settings.notifyHigh === 'true') ||
      (severity === 'medium' && settings.notifyMedium === 'true') ||
      (severity === 'low' && settings.notifyLow === 'true');

    if (!shouldNotify) return;

    const message = `
<b>🚨 NETGUARD ALERT: ${alert.type}</b>
────────────────
<b>Severity:</b> ${alert.severity.toUpperCase()}
<b>Description:</b> ${alert.description}
<b>Source:</b> ${alert.source_ip || 'N/A'}
<b>Time:</b> ${new Date(alert.timestamp).toLocaleString('uz-UZ')}
────────────────
<i>Powered by NetGuard AI System</i>
    `;

    // 4. Send Telegram
    if (settings.telegramEnabled === 'true' && settings.telegramToken && settings.telegramChatId) {
      await sendTelegram(settings.telegramToken, settings.telegramChatId, message);
    }

    // 5. Send Email
    if (settings.emailEnabled === 'true' && settings.emailUser && settings.emailPass) {
      const emailConfig = { user: settings.emailUser, pass: settings.emailPass };
      const emailHtml = `
        <div style="font-family: sans-serif; background: #0b1121; color: #fff; padding: 20px; border-radius: 10px; border: 1px solid #22c55e;">
          <h2 style="color: #22c55e; margin-top: 0;">🛡️ NetGuard AI Alert</h2>
          <hr style="border: 0; border-top: 1px solid #333; margin: 15px 0;" />
          <p><strong>Type:</strong> ${alert.type}</p>
          <p><strong>Severity:</strong> <span style="color: ${alert.severity === 'critical' ? '#ef4444' : '#f97316'}">${alert.severity.toUpperCase()}</span></p>
          <p><strong>Description:</strong> ${alert.description}</p>
          <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
          <p style="font-size: 12px; color: #888; margin-top: 20px;">This is an automated security report from your NetGuard SOC system.</p>
        </div>
      `;
      // By default send to the admin email defined in settings if exists, or alert someone else
      // For now, let's assume setting 'adminEmail' exists or use emailUser
      await sendEmail(emailConfig, settings.adminEmail || settings.emailUser, `[NetGuard Alert] ${alert.type}`, emailHtml);
    }

  } catch (error) {
    console.error('Alert Processing Error:', error);
  }
};

module.exports = { processAlertNotification, sendTelegram, sendEmail };
