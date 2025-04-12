const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"EKSUBRO Matchmaking" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    sendWelcomeEmail: async (user) => {
        const subject = 'Welcome to EKSUBRO Matchmaking';
        const text = `Hi ${user.name},\n\nWelcome to EKSUBRO Matchmaking!`;
        const html = `<h1>Welcome to EKSUBRO Matchmaking</h1><p>Hi ${user.name},</p><p>Welcome to EKSUBRO Matchmaking!</p>`;
        return sendEmail(user.email, subject, text, html);
    },
    sendPaymentConfirmation: async (user, payment) => {
        const subject = 'Payment Confirmation';
        const text = `Hi ${user.name},\n\nYour payment of ₦${payment.amount / 100} was successful.`;
        const html = `<h1>Payment Confirmation</h1><p>Hi ${user.name},</p><p>Your payment of ₦${payment.amount / 100} was successful.</p>`;
        return sendEmail(user.email, subject, text, html);
    },
};