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

import { prisma } from "@core/lib/Prisma.js";

import { VoteType } from "@prisma/client";

export class Show extends Handler {
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

        const post = await prisma.post.findFirst({
            where: {
                id
            }
        });

        if (!post) {
            throw new HTTPError('Post not found.', EStatusCode.NOT_FOUND);
        }

        // Since the Auth middleware is used, the user is already authenticated
        const user = this.#auth.user(req)!;

        const vote = await prisma.postVote.findFirst({ where: { postId: id, userId: user.id } });
        if (!vote) {
            throw new HTTPError('Vote not found.', EStatusCode.NOT_FOUND);
        }

        return Response.json(vote);
    }
}

export class Update extends Handler {
    #auth: Auth;

    constructor(app: Application) {
        super(app);

        this.#auth = app.services.get(AuthServiceProvider);
    }

    override async handle(req: Request<{ kind: VoteType; }>): Promise<Response> {
        const id = req.params.get('id');
        if (!id || !validateUUID(id)) {
            throw new HTTPError("Invalid ID.", EStatusCode.BAD_REQUEST);
        }

        const post = await prisma.post.findFirst({
            where: {
                id
            }
        });

        if (!post) {
            throw new HTTPError('Post not found.', EStatusCode.NOT_FOUND);
        }

        // Since the Auth middleware is used, the user is already authenticated
        const user = this.#auth.user(req)!;

        const vote = await prisma.postVote.findFirst({ where: { postId: id, userId: user.id } });
        if (vote) {
            vote.kind = req.parsedBody?.kind!;

            await prisma.postVote.update({ where: { id: vote.id }, data: { kind: vote.kind } });

            return Response.json(vote);
        } else {
            const vote = await prisma.postVote.create({
                data: {
                    id: generateUUID(),
                    kind: req.parsedBody?.kind!,
                    user: {
                        connect: {
                            id: user.id
                        }
                    },
                    post: {
                        connect: {
                            id: post.id
                        }
                    }
                }
            });

            return Response.json(vote);
        }
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

        const post = await prisma.post.findFirst({
            where: {
                id
            }
        });

        if (!post) {
            throw new HTTPError('Post not found.', EStatusCode.NOT_FOUND);
        }

        // Since the Auth middleware is used, the user is already authenticated
        const user = this.#auth.user(req)!;

        const vote = await prisma.postVote.findFirst({ where: { postId: id, userId: user.id } });
        if (!vote) {
            throw new HTTPError('Vote not found.', EStatusCode.NOT_FOUND);
        }

        await prisma.postVote.delete({ where: { id: vote.id } });

        return Response.empty();
    }
}
