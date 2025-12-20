/**
 * Waitlist confirmation email template
 * Friendly, concise, human tone - not marketing-heavy
 */
export const waitlistConfirmationEmail = () => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; padding: 0; margin: 0; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        
        <h1 style="color: #111; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; line-height: 1.3;">
          Thanks for joining us!
        </h1>
        
        <p style="color: #444; font-size: 16px; margin: 0 0 20px 0;">
          We're excited to have you on the KOVARI waitlist.
        </p>
        
        <p style="color: #444; font-size: 16px; margin: 0 0 20px 0;">
          KOVARI helps travelers like you connect with others who share similar travel plans and interests. Whether you're planning a solo adventure or looking for travel companions, we're building a space where meaningful connections happen naturally.
        </p>
        
        <p style="color: #444; font-size: 16px; margin: 0 0 24px 0;">
          We'll let you know as soon as we're ready to welcome you. In the meantime, if you have any travel plans you'd like to share or feedback you'd like to give, just reply to this email. We read every message and would love to hear from you.
        </p>
        
        <p style="color: #666; font-size: 15px; margin: 32px 0 0 0;">
          See you soon,<br>
          <span style="color: #111;">The KOVARI team</span>
        </p>
        
      </div>
      
      <div style="max-width: 600px; margin: 20px auto; text-align: center;">
        <p style="color: #999; font-size: 13px; margin: 0;">
          &copy; ${new Date().getFullYear()} KOVARI
        </p>
      </div>
    </body>
  </html>
`;
