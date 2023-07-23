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
import { generateUUID } from "midori/util/uuid.js";
import { Application } from "midori/app";
import { JWT } from "midori/jwt";
import { Auth } from "midori/auth";
import { AuthServiceProvider, JWTServiceProvider } from "midori/providers";

import AccessTokenDAO from "@core/dao/AccessTokenDAO.js";
import UserDAO from "@core/dao/UserDAO.js";
import AuthBearerService from "@app/services/AuthBearerService.js";
import AuthBearerServiceProvider from "@app/providers/AuthBearerServiceProvider.js";

export default class Oauth2Handler extends Handler {
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

    async handleRefreshTokenGrant(req: Request<{ grant_type: string, refresh_token: string }>): Promise<Response> {
        if (!req.parsedBody?.refresh_token) {
            throw new HTTPError("Invalid request.", EStatusCode.BAD_REQUEST);
        }

        const jwsData = this.#jwt.decrypt(req.parsedBody.refresh_token);
        if (!jwsData) {
            throw new HTTPError("Invalid refresh token.", EStatusCode.BAD_REQUEST);
        }

        const payload = JSON.parse(jwsData.toString()) as Payload;

        const accessToken = await AccessTokenDAO.get({ where: { id: payload.sub } });
        if (!accessToken || accessToken.expiresAt < new Date() || accessToken.revokedAt) {
            throw new HTTPError("Invalid refresh token.", EStatusCode.BAD_REQUEST);
        }

        const user = await UserDAO.get({ where: { id: accessToken.userId } });
        if (!user) {
            throw new HTTPError("Invalid refresh token.", EStatusCode.BAD_REQUEST);
        }

        const tokenInfo = await this.#authBearer.generateToken(user, accessToken.scope, req);

        await AccessTokenDAO.save(payload.sub!, { revokedAt: new Date() });

        return Response.json(tokenInfo).withStatus(EStatusCode.CREATED);
    }

    async handle(req: Request<{ grant_type: string; }>): Promise<Response> {
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
