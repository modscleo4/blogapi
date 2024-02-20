/**
 * Copyright 2023 Dhiego Cassiano Fogaça Barbosa
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
    static override config: symbol = Symbol('blogapi::Oauth2::Login');
}

export default function Oauth2LoginConfigProviderFactory(config: Oauth2LoginConfig): Constructor<Oauth2LoginConfigProvider> & { [K in keyof typeof Oauth2LoginConfigProvider]: typeof Oauth2LoginConfigProvider[K] } {
    return class extends Oauth2LoginConfigProvider {
        override register(app: Application): Oauth2LoginConfig {
            return config;
        }
    }
}
