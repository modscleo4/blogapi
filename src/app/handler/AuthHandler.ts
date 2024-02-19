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

import { readFileSync } from "fs";
import Handlebars from "handlebars";

import { Application } from "midori/app";
import { Auth } from "midori/auth";
import { HTTPError, ValidationError } from "midori/errors";
import { Hash } from "midori/hash";
import { EStatusCode, Handler, Request, Response } from "midori/http";
import { JWT } from "midori/jwt";
import { AuthServiceProvider, HashServiceProvider, JWTServiceProvider } from "midori/providers";
import { generateUUID } from "midori/util/uuid.js";

import { prisma } from "@core/lib/Prisma.js";

import SMTPServiceProvider from "@app/providers/SMTPServiceProvider.js";
import SMTPService from "@app/services/SMTPService.js";
import { BlogsConfig, BlogsConfigProvider } from "@app/providers/BlogsConfigProvider.js";

type EmailVerificationPayload = {
    sub: string;
    exp?: number;
};

export class Register extends Handler {
    #hash: Hash;

    constructor(app: Application) {
        super(app);

        this.#hash = app.services.get(HashServiceProvider);
    }

    override async handle(req: Request<{ username: string, email: string, name: string, bio?: string | null, password: string; }>): Promise<Response> {
        if (!req.parsedBody) {
            throw new HTTPError("Invalid body.", EStatusCode.BAD_REQUEST);
        }

        const user = await prisma.user.findMany({
            where: {
                OR: [
                    { email: req.parsedBody.email },
                    { username: req.parsedBody.username },
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

        const password = this.#hash.hash(req.parsedBody.password);

        await prisma.user.create({
            data: {
                id: generateUUID(),
                username: req.parsedBody.username,
                email: req.parsedBody.email,
                name: req.parsedBody.name,
                bio: req.parsedBody.bio,
                password,
            }
        });

        return Response.status(EStatusCode.CREATED);
    }
}

export class RequestEmailVerification extends Handler {
    #auth: Auth;
    #jwt: JWT;
    #smtp: SMTPService;
    #blogsConfig: BlogsConfig;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
        this.#jwt = app.services.get(JWTServiceProvider);
        this.#smtp = app.services.get(SMTPServiceProvider);
        this.#blogsConfig = app.config.get(BlogsConfigProvider)!;
    }

    override async handle(req: Request<{ email: string; }>): Promise<Response> {
        // Since the AuthBearer middleware is used, the user is already authenticated
        const authUser = this.#auth.user(req)!;

        const user = (await prisma.user.findFirst({ where: { id: authUser.id } }))!;
        if (user.emailVerifiedAt !== null) {
            throw new HTTPError('Email already verified', EStatusCode.FORBIDDEN);
        }

        const expiresIn = 60 * 60 * 1; // 1 hour
        const payload = <EmailVerificationPayload> { sub: user.email, exp: Math.floor(Date.now() / 1000) + expiresIn };
        const token = this.#jwt.encrypt(Buffer.from(JSON.stringify(payload)), 'application/json');

        const emailFrom = this.#smtp.from;
        const verifyUrl = `${this.#blogsConfig.url}/email/verify?token=${token}`;

        const template = Handlebars.compile(readFileSync('./src/email/verify.en.hbs', { encoding: 'utf-8' }));
        const html = template({ name: user.name, verifyUrl, expiresIn: expiresIn / 60 });

        await this.#smtp.transporter.sendMail({
            from: `Blogs <${emailFrom}>`,
            to: user.email,
            subject: 'Verify your email',
            text: `Click here to verify your email: ${verifyUrl}.\n\nThis link will expire in 1 hour. If you didn't request a verification, please ignore this email.`,
            html,
        });

        return Response.status(EStatusCode.CREATED);
    }
}

export class VerifyEmail extends Handler {
    #jwt: JWT;

    constructor(app: Application) {
        super(app);

        this.#jwt = app.services.get(JWTServiceProvider);
    }

    override async handle(req: Request): Promise<Response> {
        const token = req.query.get('token');
        if (!token) {
            throw new HTTPError("Token not provided", EStatusCode.BAD_REQUEST);
        }

        const decrypted = this.#jwt.decrypt(token);
        if (!decrypted) {
            throw new HTTPError("Invalid token", EStatusCode.BAD_REQUEST);
        }

        const payload: EmailVerificationPayload = JSON.parse(decrypted.toString());

        if (payload.exp && payload.exp < Date.now() / 1000) {
            throw new HTTPError("Token expired", EStatusCode.BAD_REQUEST);
        }

        const user = await prisma.user.findFirst({ where: { email: payload.sub } });
        if (!user) {
            throw new HTTPError("User not found", EStatusCode.NOT_FOUND);
        }

        if (user.emailVerifiedAt !== null) {
            throw new HTTPError("Email already verified", EStatusCode.BAD_REQUEST);
        }

        await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });

        return Response.status(EStatusCode.NO_CONTENT);
    }
}

export class ShowUser extends Handler {
    #auth: Auth;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
    }

    override async handle(req: Request): Promise<Response> {
        // Since the AuthBearer middleware is used, the user is already authenticated
        const authUser = this.#auth.user(req)!;

        const user = (await prisma.user.findFirst({ select: { id: true, username: true, email: true, name: true, emailVerifiedAt: true }, where: { id: authUser.id } }))!;

        return Response.json(user);
    }
}

export class UpdateUser extends Handler {
    #auth: Auth;
    #hash: Hash;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
        this.#hash = app.services.get(HashServiceProvider);
    }

    override async handle(req: Request<{ username: string; name: string; bio: string | null; email: string; password: string; }>): Promise<Response> {
        // Since the AuthBearer middleware is used, the user is already authenticated
        const authUser = this.#auth.user(req)!;

        const user = (await prisma.user.findFirst({ select: { id: true, username: true, email: true, name: true, bio: true, emailVerifiedAt: true }, where: { id: authUser.id } }))!;

        if (!req.parsedBody) {
            throw new HTTPError("Invalid body.", EStatusCode.BAD_REQUEST);
        }

        const password = this.#hash.hash(req.parsedBody.password);

        user.username = req.parsedBody.username;
        user.email = req.parsedBody.email;
        user.name = req.parsedBody.name;
        user.bio = req.parsedBody.bio;

        await prisma.user.update({
            where: { id: user.id },
            data: {
                username: user.username,
                email: user.email,
                name: user.name,
                bio: user.bio,
                password: password,
            }
        });

        return Response.json({ id: user.id, username: user.username, email: user.email, name: user.name, bio: user.bio, emailVerifiedAt: user.emailVerifiedAt });
    }
}

export class PatchUser extends Handler {
    #auth: Auth;
    #hash: Hash;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
        this.#hash = app.services.get(HashServiceProvider);
    }

    override async handle(req: Request<{ username?: string; name?: string; bio?: string | null; email?: string; password?: string; }>): Promise<Response> {
        // Since the AuthBearer middleware is used, the user is already authenticated
        const authUser = this.#auth.user(req)!;

        const user = (await prisma.user.findFirst({ select: { id: true, username: true, email: true, name: true, bio: true, emailVerifiedAt: true }, where: { id: authUser.id } }))!;

        if (!req.parsedBody) {
            throw new HTTPError("Invalid body.", EStatusCode.BAD_REQUEST);
        }

        if (req.parsedBody.username !== undefined) {
            user.username = req.parsedBody.username;
        }

        if (req.parsedBody.email !== undefined) {
            user.email = req.parsedBody.email;
        }

        if (req.parsedBody.name !== undefined) {
            user.name = req.parsedBody.name;
        }

        if (req.parsedBody.bio !== undefined) {
            user.bio = req.parsedBody.bio;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                username: user.username,
                email: user.email,
                name: user.name,
                bio: user.bio,
                ...(req.parsedBody.password ? { password: this.#hash.hash(req.parsedBody.password) } : {}),
            }
        });

        return Response.json(user);
    }
}
