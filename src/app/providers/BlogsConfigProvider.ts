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

export type BlogsConfig = {
    url: string;
};

export abstract class BlogsConfigProvider extends ConfigProvider<BlogsConfig> {
    static config: string = 'blogapi::Blog';
}

export default function BlogsConfigProviderFactory(config: BlogsConfig): Constructor<BlogsConfigProvider> & { [K in keyof typeof BlogsConfigProvider]: typeof BlogsConfigProvider[K] } {
    return class extends BlogsConfigProvider {
        register(app: Application): BlogsConfig {
            return config;
        }
    };
}
