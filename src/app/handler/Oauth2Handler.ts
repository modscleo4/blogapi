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

import { EStatusCode, Handler, Request, Response } from "midori/http";
import { HTTPError } from "midori/errors";
import { Payload } from "midori/util/jwt.js";
import { Application } from "midori/app";
import { JWT } from "midori/jwt";
import { Auth } from "midori/auth";
import { AuthServiceProvider, JWTServiceProvider } from "midori/providers";

import { prisma } from "@core/lib/Prisma.js";

import AuthBearerService from "@app/services/AuthBearerService.js";
import AuthBearerServiceProvider from "@app/providers/AuthBearerServiceProvider.js";

export class ListKeys extends Handler {
    #jwt: JWT;

    constructor(app: Application) {
        super(app);

        this.#jwt = app.services.get(JWTServiceProvider);
    }

    override async handle(req: Request): Promise<Response> {
        const jwks = this.#jwt.getPublicKeys();

        return Response.json({
            keys: jwks,
        });
    }
}

export class Token extends Handler {
    #jwt: JWT;
    #auth: Auth;
    #authBearer: AuthBearerService;

    constructor(app: Application) {
        super(app);

        this.#jwt = app.services.get(JWTServiceProvider);
        this.#auth = app.services.get(AuthServiceProvider);
        this.#authBearer = app.services.get(AuthBearerServiceProvider);
    }

    async handlePasswordGrant(req: Request<{ grant_type: string, username: string, password: string, scope?: string; }>): Promise<Response> {
        if (!req.parsedBody?.username || !req.parsedBody?.password) {
            throw new HTTPError("Invalid request.", EStatusCode.BAD_REQUEST);
        }

        const user = await this.#auth.attempt(req.parsedBody.username, req.parsedBody.password);
        if (!user) {
            throw new HTTPError("Wrong username or password.", EStatusCode.BAD_REQUEST);
        }

        const tokenInfo = await this.#authBearer.generateToken(user, req.parsedBody.scope || '*', req);

        return Response.json(tokenInfo).withStatus(EStatusCode.CREATED);
    }

    async handleRefreshTokenGrant(req: Request<{ grant_type: string, refresh_token: string; }>): Promise<Response> {
        if (!req.parsedBody?.refresh_token) {
            throw new HTTPError("Invalid request.", EStatusCode.BAD_REQUEST);
        }

        const jweData = this.#jwt.decrypt(req.parsedBody.refresh_token);
        if (!jweData) {
            throw new HTTPError("Invalid refresh token.", EStatusCode.BAD_REQUEST);
        }

        const payload = JSON.parse(jweData.toString()) as Payload;

        const accessToken = await prisma.accessToken.findFirst({ where: { id: payload.sub } });
        if (!accessToken || accessToken.revokedAt || (payload.exp && payload.exp < Date.now() / 1000)) {
            throw new HTTPError("Invalid refresh token.", EStatusCode.BAD_REQUEST);
        }

        const user = await prisma.user.findFirst({ where: { id: accessToken.userId } });
        if (!user) {
            throw new HTTPError("Invalid refresh token.", EStatusCode.BAD_REQUEST);
        }

        const tokenInfo = await this.#authBearer.generateToken(user, accessToken.scope, req);

        await prisma.accessToken.update({ where: { id: payload.sub! }, data: { revokedAt: new Date() } });

        return Response.json(tokenInfo).withStatus(EStatusCode.CREATED);
    }

    override async handle(req: Request<{ grant_type: string; }>): Promise<Response> {
        if (!req.parsedBody || !req.parsedBody.grant_type) {
            throw new HTTPError("Invalid request.", EStatusCode.UNAUTHORIZED);
        }

        switch (req.parsedBody.grant_type) {
            case 'password':
                return await this.handlePasswordGrant(req as Request<{ grant_type: string; username: string; password: string; scope?: string | undefined; }>);
            case 'refresh_token':
                return await this.handleRefreshTokenGrant(req as Request<{ grant_type: string; refresh_token: string; }>);
        }

        throw new HTTPError("Invalid request.", EStatusCode.UNAUTHORIZED);
    }
}
