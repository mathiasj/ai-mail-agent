import { MailgateClient, EmailsResource, DraftsResource } from '@mailgate/sdk';

const API_URL = process.env.MAILGATE_API_URL || 'http://localhost:3005';
const API_KEY = process.env.MAILGATE_API_KEY;

if (!API_KEY) {
  console.warn('MAILGATE_API_KEY not set — server-side Mailgate calls will fail');
}

const client = new MailgateClient({
  baseUrl: API_URL,
  apiKey: API_KEY,
});

export const mailgateEmails = new EmailsResource(client);
export const mailgateDrafts = new DraftsResource(client);
