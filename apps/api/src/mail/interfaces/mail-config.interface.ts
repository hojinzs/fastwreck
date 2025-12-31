export enum MailDriver {
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  SMTP = 'smtp',
}

export interface MailConfig {
  driver?: MailDriver;
  from: {
    name: string;
    address: string;
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
    baseUrl?: string;
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: {
    name?: string;
    address?: string;
  };
}
