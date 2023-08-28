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

import { prisma } from "@core/lib/Prisma.js";
import { Application } from "midori/app";
import { User } from "midori/auth";
import { Request } from "midori/http";
import { JWT } from "midori/jwt";
import { JWTServiceProvider } from "midori/providers";
import { Payload as JWTPayload } from "midori/util/jwt.js";
import { generateUUID } from "midori/util/uuid.js";

const allScopes        = ['write:profile', 'write:posts', 'vote:posts', 'delete:posts', 'write:replies', 'vote:replies', 'delete:replies'];
const restrictedScopes = ['write:posts', 'vote:posts', 'delete:posts', 'write:replies', 'vote:replies', 'delete:replies'];

export default class AuthBearerService {
    #jwt: JWT;

    constructor(app: Application) {
        this.#jwt = app.services.get(JWTServiceProvider);
    }

    async generateToken(user: User, scope: string, req: Request): Promise<{ token_type: 'Bearer'; access_token: string; refresh_token: string; expires_in: number; scope: string; }> {
        const issuedAt = Date.now();
        const expires = 1000 * 60 * 10; // 10 minutes

        scope = scope.trim();

        if (scope === '*') {
            scope = allScopes.join(' ');
        }

        const prismaUser = await prisma.user.findUniqueOrThrow({
            where: { id: user.id },
        });

        if (!prismaUser.emailVerifiedAt) {
            // Do not allow access to unverified users.
            scope = scope.split(' ').filter(s => !restrictedScopes.includes(s)).join(' ');
        }

        scope = scope.split(' ').filter(s => allScopes.includes(s)).join(' ');

        const data: (JWTPayload & { username: string; scope: string; }) = {
            iss: `${req.headers['x-forwarded-proto'] ?? 'http'}://${req.headers.host}`,
            aud: `${req.headers['x-forwarded-proto'] ?? 'http'}://${req.headers.host}`,
            sub: user.id,
            exp: Math.ceil((issuedAt + expires) / 1000),
            iat: Math.floor(issuedAt / 1000),
            jti: generateUUID(),

            username: user.username,
            scope,
        };

        const access_token = this.#jwt.sign(data);
        const refresh_token = this.#jwt.encrypt(Buffer.from(JSON.stringify(<JWTPayload> { jti: generateUUID(), sub: data.jti })), 'JWT');

        await prisma.accessToken.create({
            data: {
                id: data.jti!,
                user: { connect: { id: user.id } },
                scope,
                expiresAt: new Date(issuedAt + expires),
                userIP: req.ip
            }
        });

        return {
            token_type: 'Bearer',
            access_token,
            refresh_token,
            expires_in: expires / 1000,
            scope,
        };
    }
}
