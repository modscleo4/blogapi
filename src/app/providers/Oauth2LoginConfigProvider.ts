import { Application, ConfigProvider } from "midori/app";
import { Constructor } from "midori/util/types.js";

export type Oauth2LoginConfig = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    authorizationUri: string;
    tokenUri: string;
    userInfoUri: string;
};

export abstract class Oauth2LoginConfigProvider extends ConfigProvider<Oauth2LoginConfig> {
    static config: string = 'blogapi::Oauth2::Login';
}

export default function Oauth2LoginConfigProviderFactory(config: Oauth2LoginConfig): Constructor<Oauth2LoginConfigProvider> & { [K in keyof typeof Oauth2LoginConfigProvider]: typeof Oauth2LoginConfigProvider[K] } {
    return class extends Oauth2LoginConfigProvider {
        register(app: Application): Oauth2LoginConfig {
            return config;
        }
    }
}
