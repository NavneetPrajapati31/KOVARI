declare module "sib-api-v3-sdk" {
  export class ApiClient {
    static instance: ApiClient;
    authentications: {
      "api-key": {
        apiKey: string;
      };
    };
    /** HTTP timeout in ms (default 60000) */
    timeout: number;
  }

  export class TransactionalEmailsApi {
    sendTransacEmail(
      sendSmtpEmail: SendSmtpEmail
    ): Promise<{ messageId?: string }>;
  }

  export class SendSmtpEmail {
    constructor();
    to?: Array<{ email: string; name?: string }>;
    sender?: { email: string; name?: string };
    subject?: string;
    htmlContent?: string;
  }
}
