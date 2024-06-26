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

import { Server } from "midori/app";
import { Scrypt } from "midori/hash";
import { ConsoleLogger, LogLevel } from "midori/log";
import {
    AuthServiceProvider,
    HashServiceProvider,
    HashServiceProviderFactory,
    JWTServiceProvider,
    LoggerServiceProviderFactory,
    RouterServiceProviderFactory,
    UserServiceProviderFactory
} from "midori/providers";
import { Router } from "midori/router";

import PrismaUserService from "@app/services/PrismaUserService.js";
import router from '@app/routes/index.js';
import AuthBearerServiceProvider from "@app/providers/AuthBearerServiceProvider.js";
import SMTPServiceProvider from "@app/providers/SMTPServiceProvider.js";

/**
 * Service Providers
 *
 * Define your service providers here.
 * Use the server.install() method to install service providers to the application.
 * Use the app.services.get() method to recover the service in your handlers and/or middleware constructors.
 */

export default function providers(server: Server): void {
    server.install(RouterServiceProviderFactory(Router.clone(router)));
    server.install(LoggerServiceProviderFactory(new ConsoleLogger({ formattingEnabled: true, minLevel: server.production ? LogLevel.INFO : LogLevel.DEBUG })));

    // Add providers here
    // Recover the provider with app.services.get(ServiceProvider) in your handlers and middleware constructors
    server.install(JWTServiceProvider);
    server.install(HashServiceProviderFactory(new Scrypt()));
    server.install(UserServiceProviderFactory(new PrismaUserService(server.services.get(HashServiceProvider))));
    server.install(AuthServiceProvider);
    server.install(AuthBearerServiceProvider);
    server.install(SMTPServiceProvider);
}
