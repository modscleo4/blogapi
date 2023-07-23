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
import { Auth } from "midori/auth";
import { HTTPError } from "midori/errors";
import { Hash } from "midori/hash";
import { EStatusCode, Handler, Request, Response } from "midori/http";
import { JWT } from "midori/jwt";
import { AuthServiceProvider, HashServiceProvider, JWTServiceProvider } from "midori/providers";
import { generateUUID } from "midori/util/uuid.js";

import UserDAO from "@core/dao/UserDAO.js";
import ValidationError from "@app/errors/ValidationError.js";
import AuthBearerService from "@app/services/AuthBearerService.js";
import AuthBearerServiceProvider from "@app/providers/AuthBearerServiceProvider.js";

type EmailVerificationPayload = {
    email: string;
};

export class Register extends Handler {
    #hash: Hash;

    constructor(app: Application) {
        super(app);

        this.#hash = app.services.get(HashServiceProvider);
    }

    async handle(req: Request<{ username: string, email: string, name: string, password: string; }>): Promise<Response> {
        const user = await UserDAO.all({
            where: {
                OR: [
                    { email: req.parsedBody!.email },
                    { username: req.parsedBody!.username },
                ]
            }
        });

        if (user.length > 0) {
            const errors: Record<string, string[]> = {};

            if (user.some(u => u.email === req.parsedBody!.email)) {
                errors.email = ['Email already in use'];
            }

            if (user.some(u => u.username === req.parsedBody!.username)) {
                errors.username = ['Username already in use'];
            }

            throw new ValidationError(errors, 'Some fields are invalid', EStatusCode.CONFLICT);
        }

        const password = this.#hash.hash(req.parsedBody!.password);

        await UserDAO.create({
            id: generateUUID(),
            username: req.parsedBody!.username,
            email: req.parsedBody!.email,
            name: req.parsedBody!.name,
            password,
        });

        return Response.status(EStatusCode.CREATED);
    }
}

export class RequestEmailVerification extends Handler {
    #jwt: JWT;

    constructor(app: Application) {
        super(app);

        this.#jwt = app.services.get(JWTServiceProvider);
    }

    async handle(req: Request<{ email: string; }>): Promise<Response> {
        const user = await UserDAO.get({ where: { email: req.parsedBody!.email } });
        if (!user) {
            throw new HTTPError('User not found', EStatusCode.NOT_FOUND);
        }

        const payload = <EmailVerificationPayload> { email: user.email };
        const token = this.#jwt.encrypt(Buffer.from(JSON.stringify(payload)), 'application/json');

        // TODO: Send email

        return Response.json({ token })
            .withStatus(EStatusCode.CREATED);
    }
}

export class VerifyEmail extends Handler {
    #jwt: JWT;

    constructor(app: Application) {
        super(app);

        this.#jwt = app.services.get(JWTServiceProvider);
    }

    async handle(req: Request): Promise<Response> {
        const token = req.query.get('token');
        if (!token) {
            throw new HTTPError("Token not provided", EStatusCode.BAD_REQUEST);
        }

        const decrypted = this.#jwt.decrypt(token);
        if (!decrypted) {
            throw new HTTPError("Invalid token", EStatusCode.BAD_REQUEST);
        }

        const payload: EmailVerificationPayload = JSON.parse(decrypted.toString());

        const user = await UserDAO.get({ where: { email: payload.email } });
        if (!user) {
            throw new HTTPError("User not found", EStatusCode.NOT_FOUND);
        }

        if (user.emailVerifiedAt !== null) {
            throw new HTTPError("Email already verified", EStatusCode.BAD_REQUEST);
        }

        await UserDAO.save(user.id, { emailVerifiedAt: new Date() });

        return Response.status(EStatusCode.NO_CONTENT);
    }
}

export class User extends Handler {
    #auth: Auth;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
    }

    async handle(req: Request): Promise<Response> {
        // Since the AuthBearer middleware is used, the user is already authenticated
        const authUser = this.#auth.user(req)!;

        const user = (await UserDAO.get({ select: { id: true, username: true, email: true, name: true }, where: { id: authUser.id } }))!;

        return Response.json(user);
    }
}
