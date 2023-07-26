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
import { Vote } from "@core/entity/Vote.js";

export default class VoteDAO {
    static async all(args?: PrismaDTO.VoteFindManyArgs): Promise<Vote[]> {
        return await prisma.vote.findMany(args);
    }

    static async create(data: PrismaDTO.VoteCreateInput): Promise<Vote> {
        return await prisma.vote.create({
            data
        });
    }

    static async get(args: PrismaDTO.VoteFindFirstArgs): Promise<Vote | null> {
        return await prisma.vote.findFirst(args);
    }

    static async save(id: string, data: PrismaDTO.VoteUpdateInput): Promise<Vote> {
        return await prisma.vote.update({
            where: {
                id
            },
            data
        });
    }

    static async delete(id: string): Promise<Vote> {
        return await prisma.vote.delete({
            where: {
                id
            }
        });
    }
}
