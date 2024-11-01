import { Injectable, Logger } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-magic-login';
import { AuthService } from '../auth.service';
import { getDataSource } from 'src/datasource.wrapper';
// import { MailgunService } from 'src/mailgun/mailgun.service';

@Injectable()
export class MagicLoginStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(MagicLoginStrategy.name);
    // private readonly mailgunService = new MailgunService();

    constructor(private authService: AuthService) {
        super({
            secret: process.env.AUTH_SECRET,
            userFields: ['email'],
            tokenField: 'token',
            jwtOptions: {
                expiresIn: process.env.MAGIC_LINK_EXPIRES_IN,
            },
            callbackUrl: process.env.FRONTEND_URL + process.env.PASSPORT_CALLBACK_URL,
            sendMagicLink: async (destination, href) =>{
                try {
                    Logger.debug(`sending email to ${destination} with Link ${href}`);
                    // await this.mailgunService.sendMail({
                    //     from: 'Padeleros.app <no-reply@padeleros.app>',
                    //     to: destination,
                    //     subject: 'Entra a Padeleros.app ahora',
                    //     text: `Entra a Padeleros.app siguiendo este enlace ${href}`,
                    //     html: `<p>Entra a Padeleros.app siguiendo este enlace <a href="${href}">Entra</a></p>`,
                    // });
                } catch (error) {
                    Logger.error(`Error sending email to ${destination} with Link ${href}. Error: ${JSON.stringify(error)}`);
                }
            },
            verify: async (payload, callback) => {
                callback (null, this.verifyUser(payload));
            }
        },
    );
    }

    async verifyUser(payload: { destination: string }) {
        Logger.log(`MagicLoginStrategy.verifyUser(${payload.destination})`);
        let result;
        await getDataSource(async (dataSource) => {
            result = await dataSource.transaction(async (manager) => {
                return await this.authService.passportLoginReturnJWT(manager, payload.destination);
            });
        });
        return result;
    }

    async validate(payload: { destination: string}) {
        Logger.log(`MagicLoginStrategy.validate(${payload.destination})`);
        let result;
        await getDataSource(async (dataSource) => {
            result = await dataSource.transaction(async (manager) => {
                return await this.authService.passportLogin(manager, payload.destination)
            });
        });
        return result;
    }
}