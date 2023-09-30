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

import { Application } from "midori/app";
import { Transporter, createTransport } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport/index.js";

import { SMTPConfig, SMTPConfigProvider } from "@app/providers/SMTPConfigProvider.js";

export default class SMTP {
    #config?: SMTPConfig;
    #transporter: Transporter<SMTPTransport.SentMessageInfo>;

    constructor(app: Application) {
        this.#config = app.config.get(SMTPConfigProvider);
        if (!this.#config) {
            throw new Error('SMTP not configured. Install the SMTPConfigProvider.');
        }

        this.#transporter = createTransport(this.#config);
    }

    get transporter() {
        return this.#transporter;
    }

    get from() {
        return this.#config?.from;
    }
}
