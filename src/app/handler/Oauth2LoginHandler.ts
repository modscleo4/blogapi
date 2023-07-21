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
import { Payload as JWTPayload } from "midori/util/jwt.js";
import { generateUUID } from "midori/util/uuid.js";

import AccessTokenDAO from "@core/dao/AccessTokenDAO.js";
import UserDAO from "@core/dao/UserDAO.js";

import { Oauth2LoginConfig, Oauth2LoginConfigProvider } from "@app/providers/Oauth2LoginConfigProvider.js";

export class Login extends Handler {
    #config?: Oauth2LoginConfig;

    constructor(app: Application) {
        super(app);

        this.#config = app.config.get(Oauth2LoginConfigProvider);
    }

    async handle(req: Request): Promise<Response> {
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

    constructor(app: Application) {
        super(app);

        this.#config = app.config.get(Oauth2LoginConfigProvider);
        this.#jwt = app.services.get(JWTServiceProvider);
    }

    async handle(req: Request<{ code: string, redirect_uri: string; }>): Promise<Response> {
        if (!this.#config) {
            throw new HTTPError('Oauth2 config not found', EStatusCode.INTERNAL_SERVER_ERROR);
        }

        const tokenRes = await fetch(this.#config.tokenUri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(this.#config.clientId + ':' + this.#config.clientSecret)
            },
            body: new URLSearchParams({
                code: req.parsedBody!.code,
                grant_type: 'authorization_code',
            })
        });

        if (!tokenRes.ok) {
            throw new HTTPError('Invalid code', EStatusCode.UNAUTHORIZED);
        }

        const tokenResBody = await tokenRes.json();

        const userinfoRes = await fetch(this.#config.userInfoUri, {
            headers: {
                'Authorization': `${tokenResBody.token_type} ${tokenResBody.access_token}`
            }
        });

        if (!userinfoRes.ok) {
            throw new HTTPError('Invalid token', EStatusCode.UNAUTHORIZED);
        }

        const { email, name, preferred_username } = await userinfoRes.json();

        let user = await UserDAO.get({ where: { email } });
        if (!user) {
            user = await UserDAO.create({
                id: generateUUID(),
                username: preferred_username,
                email,
                name,
            });
        }

        const scope = "*";
        const issuedAt = Date.now();
        const expires = 1000 * 60 * 60 * 24 * 30; // 30 days

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

        await AccessTokenDAO.create({ id: data.jti!, user: { connect: { id: user.id } }, scope, expiresAt: new Date(issuedAt + expires), userIP: req.ip });

        return Response.json({
            token_type: 'Bearer',
            access_token,
            refresh_token,
            expires_in: expires / 1000,
            scope,
        }).withStatus(EStatusCode.CREATED);
    }
}
