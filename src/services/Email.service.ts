import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//

export class EmailService {
  /** update the realtor regarding the payment method */
  static async sendInvice(subject: string, html: string) {
    try {
      const sendEmail = await transporter.sendMail({
        from: `"No-Reply" <${process.env.EMAIL_USER}>`,
        to: ['info@realtoruplift.com'],
        subject,
        html,
      });

      console.log(sendEmail);
    } catch (err: any) {
      throw new Error(
        err.response?.data?.message ||
          err.message ||
          'Request failed In realtoruplift information service',
      );
    }
  }
}
