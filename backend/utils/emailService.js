const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Send contact form email
const sendContactEmail = async (contactData) => {
    const transporter = createTransporter();

    const { name, email, subject, message, phone } = contactData;

    // Email to admin
    const adminMailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_USER,
        subject: `New Contact Form Submission: ${subject}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4a90e2;">New Contact Form Submission</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Contact Details:</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Message:</strong></p>
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                </div>
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>This email was sent from your portfolio contact form.</p>
                    <p>Time: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        `
    };

    // Email to user (confirmation)
    const userMailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Thank you for contacting me!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4a90e2;">Thank you for reaching out!</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p>Dear ${name},</p>
                    <p>Thank you for contacting me through my portfolio website. I have received your message and will get back to you as soon as possible.</p>
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h4 style="margin-top: 0;">Your Message:</h4>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Message:</strong></p>
                        <div style="border-left: 3px solid #4a90e2; padding-left: 15px; margin-top: 10px;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    <p>I typically respond within 24-48 hours. If you have any urgent inquiries, please don't hesitate to reach out through other channels.</p>
                </div>
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>Best regards,</p>
                    <p><strong>Sonai Chatterjee</strong></p>
                    <p>Web Developer | AI Enthusiast | Creative Thinker</p>
                </div>
            </div>
        `
    };

    try {
        // Send email to admin
        await transporter.sendMail(adminMailOptions);
        console.log('Contact notification sent to admin');

        // Send confirmation email to user
        await transporter.sendMail(userMailOptions);
        console.log('Confirmation email sent to user');

        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
    const transporter = createTransporter();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4a90e2;">Password Reset Request</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p>You requested a password reset for your admin account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #4a90e2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #4a90e2;">${resetUrl}</p>
                    <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
                </div>
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>If you didn't request this password reset, please ignore this email.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent');
        return true;
    } catch (error) {
        console.error('Password reset email failed:', error);
        throw error;
    }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Welcome to Portfolio Admin Panel',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4a90e2;">Welcome to the Admin Panel!</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p>Dear ${name},</p>
                    <p>Welcome to your portfolio website admin panel! Your account has been successfully created.</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Manage your projects</li>
                        <li>View and respond to contact form submissions</li>
                        <li>Update your skills and achievements</li>
                        <li>Monitor website analytics</li>
                    </ul>
                    <p>If you have any questions or need assistance, feel free to reach out.</p>
                </div>
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>Best regards,</p>
                    <p><strong>Portfolio System</strong></p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent');
        return true;
    } catch (error) {
        console.error('Welcome email failed:', error);
        throw error;
    }
};

// Test email configuration
const testEmailConfig = async () => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_USER,
        subject: 'Email Configuration Test',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4a90e2;">Email Configuration Test</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p>This is a test email to verify that your email configuration is working correctly.</p>
                    <p>If you received this email, your email service is properly configured!</p>
                    <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Test email sent successfully');
        return true;
    } catch (error) {
        console.error('Test email failed:', error);
        throw error;
    }
};

module.exports = {
    sendContactEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    testEmailConfig
};
