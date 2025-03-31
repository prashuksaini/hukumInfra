# Contact Form Server

## Environment Variables

Make sure to set up the environment variables on your deployment platform. Do not commit your `.env` file to version control. It is already listed in `.gitignore` to prevent this.

### Important Variables:
- `GMAIL_USER`: Your Gmail address for sending emails.
- `GMAIL_APP_PASSWORD`: Your app-specific password for Gmail.
- `RECIPIENT_EMAIL`: The recipient email for form submissions.

Always handle the `.env` file securely and ensure these variables are correctly configured in your deployment settings.

