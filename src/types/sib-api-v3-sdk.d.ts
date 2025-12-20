declare module "sib-api-v3-sdk" {
  export class ApiClient {
    static instance: ApiClient;
    authentications: {
      "api-key": {
        apiKey: string;
      };
    };
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
