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
import { AccessToken } from "@core/entity/AccessToken.js";
import { Prisma } from "@prisma/client";

export default class AccessTokenDAO {
    static async all(args?: PrismaDTO.AccessTokenFindManyArgs): Promise<AccessToken[]> {
        return await prisma.accessToken.findMany(args);
    }

    static async create(data: PrismaDTO.AccessTokenCreateInput): Promise<AccessToken> {
        return await prisma.accessToken.create({
            data
        });
    }

    static async get(args: PrismaDTO.AccessTokenFindFirstArgs): Promise<AccessToken | null> {
        return await prisma.accessToken.findFirst(args);
    }

    static async save(id: string, data: PrismaDTO.AccessTokenUpdateInput): Promise<AccessToken> {
        return await prisma.accessToken.update({
            where: {
                id
            },
            data
        });
    }

    static async delete(id: string): Promise<AccessToken> {
        return await prisma.accessToken.delete({
            where: {
                id
            }
        });
    }
}
