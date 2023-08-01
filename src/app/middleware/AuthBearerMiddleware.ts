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

import { Request } from "midori/http";
import { AuthBearerMiddleware as BaseAuthBearerMiddleware } from "midori/middlewares";
import { Payload } from "midori/util/jwt.js";

import { prisma } from "@core/lib/Prisma.js";

export default class AuthBearerMiddleware extends BaseAuthBearerMiddleware {
    async validateToken(req: Request, payload: Payload): Promise<boolean> {
        if (!await super.validateToken(req, payload)) {
            return false;
        }

        const access_token = await prisma.accessToken.findFirst({ where: { id: payload.jti } });
        if (!access_token) {
            return false;
        }

        if (access_token.expiresAt < new Date()) {
            return false;
        }

        if (access_token.revokedAt) {
            return false;
        }

        if (access_token.userIP && access_token.userIP !== req.ip) {
            return false;
        }

        return true;
    }
}
