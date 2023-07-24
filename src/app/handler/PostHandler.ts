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
import { generateUUID } from "midori/util/uuid.js";
import { Auth } from "midori/auth";
import { Application } from "midori/app";
import { AuthServiceProvider } from "midori/providers";

import { Prisma } from "@prisma/client";
import PostDAO from "@core/dao/PostDAO.js";

export class List extends Handler {
    async handle(req: Request): Promise<Response> {
        const data = await PostDAO.all({ include: { user: { select: { username: true } } }, orderBy: { createdAt: 'desc' } });

        return Response.json(data);
    }
}

export class Create extends Handler {
    #auth: Auth;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
    }

    async handle(req: Request<{ title: string, resume: string, content: Record<string, any>, imageUrl?: string | null; }>): Promise<Response> {
        if (!req.parsedBody) {
            throw new HTTPError("Invalid body.", EStatusCode.BAD_REQUEST);
        }

        const id = generateUUID();

        // Since the AuthBearer middleware is used, the user is already authenticated
        const user = this.#auth.user(req)!;

        const data: Prisma.PostCreateInput = {
            id,
            user: {
                connect: { id: user.id },
            },
            title: req.parsedBody.title,
            resume: req.parsedBody.resume,
            content: req.parsedBody.content,
            imageUrl: req.parsedBody.imageUrl
        };

        const saved = await PostDAO.create(data);
        if (!saved) {
            throw new HTTPError("Failed to save post.", EStatusCode.INTERNAL_SERVER_ERROR);
        }

        return Response.json(saved).withStatus(EStatusCode.CREATED);
    }
}

export class Show extends Handler {
    async handle(req: Request): Promise<Response> {
        const id = req.params.get('id');
        if (!id || !id.match(/^[0-9a-f]{8}(-[0-9a-f]{4}){4}[0-9a-f]{8}$/i)) {
            throw new HTTPError("Invalid ID.", EStatusCode.BAD_REQUEST);
        }

        const post = await PostDAO.get({
            where: {
                id
            },
            include: { user: { select: { username: true } } }
        });

        if (!post) {
            throw new HTTPError('Post not found.', EStatusCode.NOT_FOUND);
        }

        return Response.json(post);
    }
}

export class Update extends Handler {
    #auth: Auth;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
    }

    async handle(req: Request<{ title: string, resume: string, content: Record<string, any>, imageUrl: string | null; }>): Promise<Response> {
        const id = req.params.get('id');
        if (!id || !id.match(/^[0-9a-f]{8}(-[0-9a-f]{4}){4}[0-9a-f]{8}$/i)) {
            throw new HTTPError("Invalid ID.", EStatusCode.BAD_REQUEST);
        }

        const post = await PostDAO.get({
            where: {
                id
            }
        });

        if (!post) {
            throw new HTTPError('Post not found.', EStatusCode.NOT_FOUND);
        }

        // Since the AuthBearer middleware is used, the user is already authenticated
        const user = this.#auth.user(req)!;

        if (post.userId !== user.id) {
            throw new HTTPError('You are not the owner of this post.', EStatusCode.FORBIDDEN);
        }

        if (!req.parsedBody) {
            throw new HTTPError("Invalid body.", EStatusCode.BAD_REQUEST);
        }

        post.title = req.parsedBody.title;
        post.resume = req.parsedBody.resume;
        post.content = req.parsedBody.content;
        post.imageUrl = req.parsedBody.imageUrl;

        await PostDAO.save(post.id, { title: post.title, resume: post.resume, content: post.content, imageUrl: post.imageUrl });

        return Response.json(post);
    }
}

export class Patch extends Handler {
    #auth: Auth;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
    }

    async handle(req: Request<{ title?: string, resume?: string, content?: Record<string, any>, imageUrl?: string | null; }>): Promise<Response> {
        const id = req.params.get('id');
        if (!id || !id.match(/^[0-9a-f]{8}(-[0-9a-f]{4}){4}[0-9a-f]{8}$/i)) {
            throw new HTTPError("Invalid ID.", EStatusCode.BAD_REQUEST);
        }

        const post = await PostDAO.get({
            where: {
                id
            }
        });

        if (!post) {
            throw new HTTPError('Post not found.', EStatusCode.NOT_FOUND);
        }

        // Since the AuthBearer middleware is used, the user is already authenticated
        const user = this.#auth.user(req)!;

        if (post.userId !== user.id) {
            throw new HTTPError('You are not the owner of this post.', EStatusCode.FORBIDDEN);
        }

        if (!req.parsedBody) {
            throw new HTTPError("Invalid body.", EStatusCode.BAD_REQUEST);
        }

        if (req.parsedBody.title) {
            post.title = req.parsedBody.title;
        }

        if (req.parsedBody.resume) {
            post.resume = req.parsedBody.resume;
        }

        if (req.parsedBody.content) {
            post.content = req.parsedBody.content;
        }

        if (req.parsedBody.imageUrl !== undefined) {
            post.imageUrl = req.parsedBody.imageUrl;
        }

        await PostDAO.save(post.id, { title: post.title, resume: post.resume, content: post.content!, imageUrl: post.imageUrl });

        return Response.json(post);
    }
}

export class Destroy extends Handler {
    #auth: Auth;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
    }

    async handle(req: Request): Promise<Response> {
        const id = req.params.get('id');
        if (!id || !id.match(/^[0-9a-f]{8}(-[0-9a-f]{4}){4}[0-9a-f]{8}$/i)) {
            throw new HTTPError("Invalid ID.", EStatusCode.BAD_REQUEST);
        }

        const post = await PostDAO.get({
            where: {
                id
            }
        });

        if (!post) {
            throw new HTTPError('Post not found.', EStatusCode.NOT_FOUND);
        }

        // Since the AuthBearer middleware is used, the user is already authenticated
        const user = this.#auth.user(req)!;

        if (post.userId !== user.id) {
            throw new HTTPError('You are not the owner of this post.', EStatusCode.FORBIDDEN);
        }

        await PostDAO.delete(post.id);

        return Response.empty();
    }
}
