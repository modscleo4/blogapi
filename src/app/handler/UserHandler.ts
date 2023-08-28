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
import { validateUUID } from "midori/util/uuid.js";

import { prisma } from "@core/lib/Prisma.js";

export class Show extends Handler {
    constructor(app: Application) {
        super(app);
    }

    async handle(req: Request): Promise<Response> {
        const id = req.params.get('id');
        if (!id || !validateUUID(id)) {
            throw new HTTPError("Invalid ID.", EStatusCode.BAD_REQUEST);
        }

        const user = (await prisma.user.findFirst({ select: { id: true, username: true, name: true, bio: true, _count: { select: { posts: true } } }, where: { id } }))!;
        if (!user) {
            throw new HTTPError("User not found.", EStatusCode.NOT_FOUND);
        }

        return Response.json({ id: user.id, username: user.username, name: user.name, bio: user.bio, posts: user._count.posts });
    }
}
