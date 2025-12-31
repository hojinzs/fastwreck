import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as sendgrid from '@sendgrid/mail';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import {
  MailConfig,
  MailDriver,
  SendMailOptions,
} from './interfaces/mail-config.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private mailConfig: MailConfig;
  private smtpTransporter?: nodemailer.Transporter;
  private mailgunClient?: any;

  constructor(private configService: ConfigService) {
    this.mailConfig = this.loadMailConfig();
    this.initializeMailDriver();
  }

  private loadMailConfig(): MailConfig {
    const driver = this.configService.get<string>('MAIL_DRIVER') as MailDriver;

    return {
      driver,
      from: {
        name:
          this.configService.get<string>('MAIL_FROM_NAME') || 'Fastwreck',
        address:
          this.configService.get<string>('MAIL_FROM_ADDRESS') ||
          'noreply@fastwreck.dev',
      },
      sendgrid: {
        apiKey: this.configService.get<string>('SENDGRID_API_KEY') || '',
      },
      mailgun: {
        apiKey: this.configService.get<string>('MAILGUN_API_KEY') || '',
        domain: this.configService.get<string>('MAILGUN_DOMAIN') || '',
        baseUrl: this.configService.get<string>('MAILGUN_BASE_URL'),
      },
      smtp: {
        host: this.configService.get<string>('SMTP_HOST') || '',
        port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
        secure:
          this.configService.get<string>('SMTP_SECURE') === 'true' || false,
        auth: {
          user: this.configService.get<string>('SMTP_USER') || '',
          pass: this.configService.get<string>('SMTP_PASS') || '',
        },
      },
    };
  }

  private initializeMailDriver() {
    if (!this.mailConfig.driver) {
      this.logger.warn('No mail driver configured. Email sending is disabled.');
      return;
    }

    try {
      switch (this.mailConfig.driver) {
        case MailDriver.SENDGRID:
          if (this.mailConfig.sendgrid?.apiKey) {
            sendgrid.setApiKey(this.mailConfig.sendgrid.apiKey);
            this.logger.log('SendGrid mail driver initialized');
          }
          break;

        case MailDriver.MAILGUN:
          if (
            this.mailConfig.mailgun?.apiKey &&
            this.mailConfig.mailgun?.domain
          ) {
            const mailgun = new Mailgun(FormData);
            this.mailgunClient = mailgun.client({
              username: 'api',
              key: this.mailConfig.mailgun.apiKey,
              url: this.mailConfig.mailgun.baseUrl,
            });
            this.logger.log('Mailgun mail driver initialized');
          }
          break;

        case MailDriver.SMTP:
          if (this.mailConfig.smtp?.host && this.mailConfig.smtp?.auth.user) {
            this.smtpTransporter = nodemailer.createTransport({
              host: this.mailConfig.smtp.host,
              port: this.mailConfig.smtp.port,
              secure: this.mailConfig.smtp.secure,
              auth: {
                user: this.mailConfig.smtp.auth.user,
                pass: this.mailConfig.smtp.auth.pass,
              },
            });
            this.logger.log('SMTP mail driver initialized');
          }
          break;

        default:
          this.logger.warn(`Unknown mail driver: ${this.mailConfig.driver}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize mail driver: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Check if mail service is available
   */
  isAvailable(): boolean {
    if (!this.mailConfig.driver) {
      return false;
    }

    switch (this.mailConfig.driver) {
      case MailDriver.SENDGRID:
        return !!this.mailConfig.sendgrid?.apiKey;
      case MailDriver.MAILGUN:
        return !!(
          this.mailConfig.mailgun?.apiKey && this.mailConfig.mailgun?.domain
        );
      case MailDriver.SMTP:
        return !!(
          this.mailConfig.smtp?.host && this.mailConfig.smtp?.auth.user
        );
      default:
        return false;
    }
  }

  /**
   * Send email using configured driver
   * Returns true if sent successfully, false if mail driver not configured
   * Throws error if sending fails
   */
  async sendMail(options: SendMailOptions): Promise<boolean> {
    if (!this.isAvailable()) {
      this.logger.warn(
        'Mail driver not configured or unavailable. Email not sent.',
      );
      return false;
    }

    const from = options.from
      ? `${options.from.name || this.mailConfig.from.name} <${options.from.address || this.mailConfig.from.address}>`
      : `${this.mailConfig.from.name} <${this.mailConfig.from.address}>`;

    try {
      switch (this.mailConfig.driver) {
        case MailDriver.SENDGRID:
          return await this.sendViaSendGrid({ ...options, from: { name: this.mailConfig.from.name, address: this.mailConfig.from.address, ...options.from } });
        case MailDriver.MAILGUN:
          return await this.sendViaMailgun({ ...options, from: { name: this.mailConfig.from.name, address: this.mailConfig.from.address, ...options.from } });
        case MailDriver.SMTP:
          return await this.sendViaSMTP({ ...options, from: { name: this.mailConfig.from.name, address: this.mailConfig.from.address, ...options.from } });
        default:
          this.logger.error('Invalid mail driver configuration');
          return false;
      }
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async sendViaSendGrid(options: SendMailOptions): Promise<boolean> {
    const to = Array.isArray(options.to) ? options.to : [options.to];
    const from = options.from
      ? `${options.from.name} <${options.from.address}>`
      : `${this.mailConfig.from.name} <${this.mailConfig.from.address}>`;

    await sendgrid.send({
      to,
      from,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    this.logger.log(`Email sent via SendGrid to ${to.join(', ')}`);
    return true;
  }

  private async sendViaMailgun(options: SendMailOptions): Promise<boolean> {
    const to = Array.isArray(options.to) ? options.to : [options.to];
    const from = options.from
      ? `${options.from.name} <${options.from.address}>`
      : `${this.mailConfig.from.name} <${this.mailConfig.from.address}>`;

    await this.mailgunClient.messages.create(this.mailConfig.mailgun!.domain, {
      from,
      to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    this.logger.log(`Email sent via Mailgun to ${to.join(', ')}`);
    return true;
  }

  private async sendViaSMTP(options: SendMailOptions): Promise<boolean> {
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const from = options.from
      ? `${options.from.name} <${options.from.address}>`
      : `${this.mailConfig.from.name} <${this.mailConfig.from.address}>`;

    await this.smtpTransporter!.sendMail({
      from,
      to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    this.logger.log(`Email sent via SMTP to ${to}`);
    return true;
  }

  /**
   * Send workspace invitation email
   */
  async sendInvitationEmail(
    to: string,
    workspaceName: string,
    inviteCode: string,
    invitedByName: string,
  ): Promise<boolean> {
    const inviteUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/invitations/accept?code=${inviteCode}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to join ${workspaceName}</h2>
        <p>${invitedByName} has invited you to join the <strong>${workspaceName}</strong> workspace on Fastwreck.</p>
        <p>Click the link below to accept the invitation:</p>
        <p style="margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this URL into your browser:<br>
          <a href="${inviteUrl}">${inviteUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This invitation will expire in 7 days.
        </p>
      </div>
    `;

    const text = `
You've been invited to join ${workspaceName}

${invitedByName} has invited you to join the ${workspaceName} workspace on Fastwreck.

Click the link below to accept the invitation:
${inviteUrl}

This invitation will expire in 7 days.
    `;

    return this.sendMail({
      to,
      subject: `You've been invited to join ${workspaceName}`,
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName?: string,
  ): Promise<boolean> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        ${userName ? `<p>Hi ${userName},</p>` : '<p>Hi,</p>'}
        <p>We received a request to reset your password. Click the link below to reset it:</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this URL into your browser:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    `;

    const text = `
Reset Your Password

${userName ? `Hi ${userName},` : 'Hi,'}

We received a request to reset your password. Click the link below to reset it:
${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
    `;

    return this.sendMail({
      to,
      subject: 'Reset Your Password',
      html,
      text,
    });
  }
}
