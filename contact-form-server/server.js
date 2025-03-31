require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));

// Logger setup
const log = {
    info: (message, data) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? data : '');
    },
    error: (message, error) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
        if (error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
            if (error.response) {
                console.error('Response error:', error.response);
            }
        }
    },
    debug: (message, data) => {
        console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
};

// Email configuration
async function createTransporter() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        log.error('Missing email configuration');
        return null;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        },
        tls: {
            rejectUnauthorized: true
        }
    });

    try {
        await transporter.verify();
        log.info('SMTP connection verified successfully');
        return transporter;
    } catch (error) {
        log.error('Failed to verify SMTP connection', error);
        return null;
    }
}

// Email template
function createEmailContent(data) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>New Contact Form Submission</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; }
                .header { background: #0056b3; color: white; padding: 20px; }
                .content { padding: 20px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>New Contact Form Submission</h2>
                </div>
                <div class="content">
                    <div class="field">
                        <div class="label">Name:</div>
                        <div>${data.name}</div>
                    </div>
                    <div class="field">
                        <div class="label">Email:</div>
                        <div>${data.email}</div>
                    </div>
                    <div class="field">
                        <div class="label">Phone:</div>
                        <div>${data.phone || 'Not provided'}</div>
                    </div>
                    <div class="field">
                        <div class="label">Message:</div>
                        <div>${data.message}</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    const text = `
        New Contact Form Submission

        Name: ${data.name}
        Email: ${data.email}
        Phone: ${data.phone || 'Not provided'}
        Message: ${data.message}
    `;

    return { html, text };
}

// Contact form endpoint
app.post('/send', async (req, res) => {
    try {
        log.info('Received contact form submission');
        log.debug('Form data:', { ...req.body, email: '****' });

        const { name, email, phone, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and message'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Get transporter
        const transporter = await createTransporter();
        if (!transporter) {
            throw new Error('Email service not available');
        }

        // Prepare email
        const { html, text } = createEmailContent(req.body);
        const mailOptions = {
            from: {
                name: 'Hukum Infra Contact Form',
                address: process.env.GMAIL_USER
            },
            to: process.env.RECIPIENT_EMAIL || process.env.GMAIL_USER,
            replyTo: email,
            subject: 'New Contact Form Submission - Hukum Infra',
            text,
            html,
            priority: 'high',
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'Importance': 'High'
            }
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        log.info('Email sent successfully', { messageId: info.messageId });

        res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully'
        });

    } catch (error) {
        log.error('Failed to process contact form submission', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

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
        log.info('Test email sent successfully', { messageId: info.messageId });
        res.status(200).json({ success: true, message: 'Test email sent successfully' });
    } catch (error) {
        log.error('Failed to send test email', error);
        res.status(500).json({ success: false, message: 'Failed to send test email' });
    }
});

app.post('/submit-form', (req, res) => {
    const { name, email, message } = req.body;
    console.log(`Name: ${name}, Email: ${email}, Message: ${message}`);
    res.status(200).send('Form submitted successfully!');
});

// Start server
app.listen(PORT, async () => {
    log.info(`Server running on port ${PORT}`);
    log.info(`Email configuration: ${process.env.GMAIL_USER ? 'CONFIGURED' : 'MISSING'}`);
    
    try {
        const transporter = await createTransporter();
        if (transporter) {
            log.info('Email service is ready');
        } else {
            log.error('Email service not available');
        }
    } catch (error) {
        log.error('Failed to initialize email service', error);
    }
});
