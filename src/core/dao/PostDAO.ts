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

import { PrismaDTO, prisma } from "@core/lib/Prisma.js";
import { Post } from "@core/entity/Post.js";
import { Prisma } from "@prisma/client";

export default class PostDAO {
    static async all(args?: PrismaDTO.PostFindManyArgs): Promise<Post[]> {
        return await prisma.post.findMany(args);
    }

    static async create(data: PrismaDTO.PostCreateInput): Promise<Post> {
        return await prisma.post.create({
            data
        });
    }

    static async get(args: PrismaDTO.PostFindFirstArgs): Promise<Post | null> {
        return await prisma.post.findFirst(args);
    }

    static async save(id: string, data: PrismaDTO.PostUpdateInput): Promise<Post> {
        return await prisma.post.update({
            where: {
                id
            },
            data
        });
    }

    static async delete(id: string): Promise<Post> {
        return await prisma.post.delete({
            where: {
                id
            }
        });
    }
}
