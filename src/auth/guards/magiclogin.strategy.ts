import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-magic-link';
import { getDataSource } from '../../datasource.wrapper';
import { AuthService } from '../auth.service';
// import { MailgunService } from '../mailgun/mailgun.service';

@Injectable()
export class MagicLoginStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(MagicLoginStrategy.name);
  // private readonly mailgunService = new MailgunService();

  constructor(private authService: AuthService) {
    super({
      secret: process.env.AUTH_SECRET,
      userFields: ['destination'],
      tokenField: 'token',
      callbackUrl: process.env.FRONTEND_URL + process.env.PASSPORT_CALLBACK_URL,
    }, async (user, token) => {
      await this.sendToken(user, token);
    }, async (payload, callback) => {
      try {
        const user = await this.verifyUser(payload);
        callback(null, user);
      } catch (err) {
        callback(err);
      }
    });
  }

  async sendToken(user: any, token: string) {
      const destination = user.destination;
      const href = `${process.env.FRONTEND_URL}${process.env.PASSPORT_CALLBACK_URL}?token=${token}`;
      try {
          Logger.debug(`sending email to ${destination} with Link ${href}`);
          // await this.mailgunService.sendMail({ ... });
      } catch (error) {
          Logger.error(
            `Error sending email to ${destination} with Link ${href}. Error: ${JSON.stringify(error)}`,
          );
      }
  }


  async verifyUser(payload: { destination: string }) {
    Logger.log(`MagicLoginStrategy.verifyUser(${payload.destination})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.authService.passportLoginReturnJWT(
          manager,
          payload.destination,
        );
      });
    });
    return result;
  }

  async validate(payload: { destination: string }) {
    Logger.log(`MagicLoginStrategy.validate(${payload.destination})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.authService.passportLogin(
          manager,
          payload.destination,
        );
      });
    });
    return result;
  }
}
