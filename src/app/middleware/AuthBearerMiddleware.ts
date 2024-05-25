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
import { Request } from "midori/http";
import { AuthBearerMiddleware as BaseAuthBearerMiddleware } from "midori/middlewares";

import { prisma } from "@core/lib/Prisma.js";

import AuthBearerService, { AccessToken } from "@app/services/AuthBearerService.js";
import AuthBearerServiceProvider from "@app/providers/AuthBearerServiceProvider.js";

export default class AuthBearerMiddleware extends BaseAuthBearerMiddleware {
    #authBearer: AuthBearerService;

    constructor(app: Application) {
        super(app);

        this.#authBearer = app.services.get(AuthBearerServiceProvider);
    }

    override async validateToken(req: Request, payload: AccessToken): Promise<boolean> {
        if (!await super.validateToken(req, payload)) {
            return false;
        }

        return await this.#authBearer.isAccessTokenValid(payload, req.ip ?? null);
    }
}
