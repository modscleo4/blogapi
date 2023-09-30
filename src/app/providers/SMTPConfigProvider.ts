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

export type SMTPConfig = {
    host: string;
    port: number;
    secure: boolean;
    from: string;
    auth?: {
        user: string;
        pass?: string;
    };
};

export abstract class SMTPConfigProvider extends ConfigProvider<SMTPConfig> {
    static config: string = 'blogapi::SMTP';
}

export default function SMTPConfigProviderFactory(config: SMTPConfig): Constructor<SMTPConfigProvider> & { [K in keyof typeof SMTPConfigProvider]: typeof SMTPConfigProvider[K] } {
    return class extends SMTPConfigProvider {
        register(app: Application): SMTPConfig {
            return config;
        }
    };
}
