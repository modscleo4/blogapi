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
import { HTTPError } from "midori/errors";
import { EStatusCode, Handler, Request, Response } from "midori/http";
import { JWT } from "midori/jwt";
import { JWTServiceProvider } from "midori/providers";
import { generateUUID } from "midori/util/uuid.js";

import { prisma } from "@core/lib/Prisma.js";

import { Oauth2LoginConfig, Oauth2LoginConfigProvider } from "@app/providers/Oauth2LoginConfigProvider.js";
import AuthBearerService from "@app/services/AuthBearerService.js";
import AuthBearerServiceProvider from "@app/providers/AuthBearerServiceProvider.js";

export class Login extends Handler {
    #config?: Oauth2LoginConfig;

    constructor(app: Application) {
        super(app);

        this.#config = app.config.get(Oauth2LoginConfigProvider);
    }

    override async handle(req: Request): Promise<Response> {
        if (!this.#config) {
            throw new HTTPError('Oauth2 config not found', EStatusCode.INTERNAL_SERVER_ERROR);
        }

        const url = new URL(this.#config.authorizationUri);
        url.searchParams.append('client_id', this.#config.clientId);
        url.searchParams.append('redirect_uri', this.#config.redirectUri);
        url.searchParams.append('response_type', 'code');
        url.searchParams.append('scope', 'openid profile email');

        return Response.json({
            url
        });
    }
}


export class Callback extends Handler {
    #config?: Oauth2LoginConfig;
    #jwt: JWT;
    #authBearer: AuthBearerService;

    constructor(app: Application) {
        super(app);

        this.#config = app.config.get(Oauth2LoginConfigProvider);
        this.#jwt = app.services.get(JWTServiceProvider);
        this.#authBearer = app.services.get(AuthBearerServiceProvider);
    }

    override async handle(req: Request<{ code: string; }>): Promise<Response> {
        if (!this.#config) {
            throw new HTTPError('Oauth2 config not found', EStatusCode.INTERNAL_SERVER_ERROR);
        }

        const tokenRes = await fetch(this.#config.tokenUri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(this.#config.clientId + ':' + this.#config.clientSecret, 'utf8').toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: req.parsedBody!.code,
                redirect_uri: this.#config.redirectUri,
            }),
        });

        if (!tokenRes.ok) {
            throw new HTTPError('Invalid code', EStatusCode.UNAUTHORIZED);
        }

        const tokenResBody: { token_type: string; access_token: string; expires_in: number; } = await tokenRes.json();

        const userinfoRes = await fetch(this.#config.userInfoUri, {
            headers: {
                'Authorization': `${tokenResBody.token_type} ${tokenResBody.access_token}`
            }
        });

        if (!userinfoRes.ok) {
            throw new HTTPError('Invalid token', EStatusCode.UNAUTHORIZED);
        }

        const { email, name, preferred_username } = await userinfoRes.json();

        const user = await prisma.user.findFirst({ where: { email } }) ?? await prisma.user.create({
            data: {
                id: generateUUID(),
                username: preferred_username,
                email,
                name,
                emailVerifiedAt: new Date(), // Verified by the OAuth2 provider.
            }
        });

        const tokenInfo = await this.#authBearer.generateToken(user, '*', req);

        return Response.json(tokenInfo).withStatus(EStatusCode.CREATED);
    }
}
