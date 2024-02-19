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
import { generateUUID, validateUUID } from "midori/util/uuid.js";
import { Auth } from "midori/auth";
import { Application } from "midori/app";
import { AuthServiceProvider } from "midori/providers";

import { PrismaDTO, prisma } from "@core/lib/Prisma.js";

import { VoteType } from "@prisma/client";

export class List extends Handler {
    override async handle(req: Request): Promise<Response> {
        const postId = req.params.get('postId');
        const replyId = req.params.get('id');

        if (!postId && !replyId) {
            throw new HTTPError("Invalid post ID or reply ID.", EStatusCode.BAD_REQUEST);
        }

        if (postId && !validateUUID(postId)) {
            throw new HTTPError("Invalid post ID.", EStatusCode.BAD_REQUEST);
        } else if (replyId && !validateUUID(replyId)) {
            throw new HTTPError("Invalid reply ID.", EStatusCode.BAD_REQUEST);
        }

        const replies = await prisma.reply.findMany({
            where: {
                postId: postId ? postId : undefined,
                replyId: postId ? null : replyId
            },
            include: {
                replies: {
                    select: {
                        id: true,
                    },
                    orderBy: {
                        points: {
                            value: 'desc'
                        }
                    },
                },
            },
            orderBy: { createdAt: 'desc' }
        });

        return Response.json(replies);
    }
}

export class Create extends Handler {
    #auth: Auth;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
    }

    override async handle(req: Request<{ content: Record<string, any>; }>): Promise<Response> {
        if (!req.parsedBody) {
            throw new HTTPError("Invalid body.", EStatusCode.BAD_REQUEST);
        }

        const postId = req.params.get('postId');
        const replyId = req.params.get('replyId');

        if (!postId && !replyId) {
            throw new HTTPError("Invalid post ID or reply ID.", EStatusCode.BAD_REQUEST);
        }

        if (postId && !validateUUID(postId)) {
            throw new HTTPError("Invalid post ID.", EStatusCode.BAD_REQUEST);
        } else if (replyId && !validateUUID(replyId)) {
            throw new HTTPError("Invalid reply ID.", EStatusCode.BAD_REQUEST);
        }

        const id = generateUUID();

        // Since the AuthBearer middleware is used, the user is already authenticated
        const user = this.#auth.user(req)!;

        const saved = await prisma.reply.create({
            data: {
                id,
                user: {
                    connect: { id: user.id },
                },
                post: {
                    connect: { id: postId },
                },
                parent: replyId ? {
                    connect: { id: replyId },
                } : undefined,
                content: req.parsedBody.content,
            }
        });
        if (!saved) {
            throw new HTTPError("Failed to save post.", EStatusCode.INTERNAL_SERVER_ERROR);
        }

        return Response.json(saved).withStatus(EStatusCode.CREATED);
    }
}

export class Show extends Handler {
    override async handle(req: Request): Promise<Response> {
        const id = req.params.get('id');
        if (!id || !validateUUID(id)) {
            throw new HTTPError("Invalid ID.", EStatusCode.BAD_REQUEST);
        }

        const reply = await prisma.reply.findFirst({
            where: {
                id
            },
            include: {
                replies: {
                    select: {
                        id: true,
                    },
                }
            }
        });

        if (!reply) {
            throw new HTTPError('Reply not found.', EStatusCode.NOT_FOUND);
        }

        const votes = (await prisma.replyVote.groupBy({
            by: ['kind'],
            where: {
                replyId: reply.id
            },
            _count: {
                kind: true
            }
        })).reduce((acc, v) => { acc[v.kind] = v._count.kind; return acc; }, {} as Record<VoteType, number>);

        return Response.json({ ...reply, votes });
    }
}

export class Update extends Handler {
    #auth: Auth;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
    }

    override async handle(req: Request<{ content: Record<string, any>; }>): Promise<Response> {
        const id = req.params.get('id');
        if (!id || !validateUUID(id)) {
            throw new HTTPError("Invalid ID.", EStatusCode.BAD_REQUEST);
        }

        const post = await prisma.reply.findFirst({
            where: {
                id
            }
        });

        if (!post) {
            throw new HTTPError('Reply not found.', EStatusCode.NOT_FOUND);
        }

        // Since the AuthBearer middleware is used, the user is already authenticated
        const user = this.#auth.user(req)!;

        if (post.userId !== user.id) {
            throw new HTTPError('You are not the owner of this post.', EStatusCode.FORBIDDEN);
        }

        if (!req.parsedBody) {
            throw new HTTPError("Invalid body.", EStatusCode.BAD_REQUEST);
        }

        post.content = req.parsedBody.content;

        await prisma.reply.update({ where: { id: post.id }, data: { content: post.content } });

        return Response.json(post);
    }
}

export class Patch extends Handler {
    #auth: Auth;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
    }

    override async handle(req: Request<{ content?: Record<string, any>; }>): Promise<Response> {
        const id = req.params.get('id');
        if (!id || !validateUUID(id)) {
            throw new HTTPError("Invalid ID.", EStatusCode.BAD_REQUEST);
        }

        const post = await prisma.reply.findFirst({
            where: {
                id
            }
        });

        if (!post) {
            throw new HTTPError('Reply not found.', EStatusCode.NOT_FOUND);
        }

        // Since the AuthBearer middleware is used, the user is already authenticated
        const user = this.#auth.user(req)!;

        if (post.userId !== user.id) {
            throw new HTTPError('You are not the owner of this post.', EStatusCode.FORBIDDEN);
        }

        if (!req.parsedBody) {
            throw new HTTPError("Invalid body.", EStatusCode.BAD_REQUEST);
        }

        if (req.parsedBody.content !== undefined) {
            post.content = req.parsedBody.content;
        }

        await prisma.reply.update({ where: { id: post.id }, data: { content: post.content! } });

        return Response.json(post);
    }
}

export class Destroy extends Handler {
    #auth: Auth;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
    }

    override async handle(req: Request): Promise<Response> {
        const id = req.params.get('id');
        if (!id || !validateUUID(id)) {
            throw new HTTPError("Invalid ID.", EStatusCode.BAD_REQUEST);
        }

        const post = await prisma.reply.findFirst({
            where: {
                id
            }
        });

        if (!post) {
            throw new HTTPError('Reply not found.', EStatusCode.NOT_FOUND);
        }

        // Since the AuthBearer middleware is used, the user is already authenticated
        const user = this.#auth.user(req)!;

        if (post.userId !== user.id) {
            throw new HTTPError('You are not the owner of this post.', EStatusCode.FORBIDDEN);
        }

        await prisma.reply.delete({ where: { id: post.id } });

        return Response.empty();
    }
}
