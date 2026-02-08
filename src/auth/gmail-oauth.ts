import { google } from 'googleapis';
import { env } from '../config/env';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
];

function createOAuth2Client() {
  return new google.auth.OAuth2(
    env.GMAIL_CLIENT_ID,
    env.GMAIL_CLIENT_SECRET,
    env.GMAIL_REDIRECT_URI
  );
}

export function getGmailAuthUrl(userId: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: userId,
    prompt: 'consent', // Force refresh token
  });
}

export async function handleGmailCallback(code: string): Promise<{
  refreshToken: string;
  accessToken: string;
  email: string;
}> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const gmail = google.gmail({ version: 'v1', auth: client });
  const profile = await gmail.users.getProfile({ userId: 'me' });

  return {
    refreshToken: tokens.refresh_token!,
    accessToken: tokens.access_token!,
    email: profile.data.emailAddress!,
  };
}

export async function getAccessToken(refreshToken: string): Promise<string> {
  const client = createOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return credentials.access_token!;
}

export function getGmailClient(accessToken: string) {
  const client = createOAuth2Client();
  client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: client });
}

export async function setupGmailWatch(accessToken: string): Promise<{
  historyId: string;
  expiration: string;
}> {
  const gmail = getGmailClient(accessToken);
  const response = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName: env.GMAIL_PUBSUB_TOPIC,
      labelIds: ['INBOX'],
    },
  });

  return {
    historyId: response.data.historyId!,
    expiration: response.data.expiration!,
  };
}
