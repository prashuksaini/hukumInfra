        log.error('Missing email configuration. Ensure GMAIL_USER and GMAIL_APP_PASSWORD environment variables are set.');
        return Promise.reject(new Error('Missing email configuration.'));
            log.error('Failed to create email transporter, email service not available');
            throw new Error('Email service not available due to transporter error');
app.get('/test-email', async (req, res) => {
    try {
        const transporter = await createTransporter();
        if (!transporter) {
            throw new Error('Email service not available');
        }

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: process.env.RECIPIENT_EMAIL || process.env.GMAIL_USER,
            subject: 'Test Email',
            text: 'This is a test email from the Hukum Infra server.',
        };

        const info = await transporter.sendMail(mailOptions);
        log.info('Test email sent successfully', { messageId: info.messageId, response: info.response });
        res.status(200).json({ success: true, message: 'Test email sent successfully', testMessageUrl: nodemailer.getTestMessageUrl(info) });
    } catch (error) {
        log.error('Failed to send test email', error);
        res.status(500).json({ success: false, message: 'Failed to send test email due to internal server error' });
    }
});
