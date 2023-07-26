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
import { Audit } from "@core/entity/Audit.js";

export default class AuditDAO {
    static async all(args?: PrismaDTO.AuditFindManyArgs): Promise<Audit[]> {
        return await prisma.audit.findMany(args);
    }

    static async create(data: PrismaDTO.AuditCreateInput): Promise<Audit> {
        return await prisma.audit.create({
            data
        });
    }

    static async get(args: PrismaDTO.AuditFindFirstArgs): Promise<Audit | null> {
        return await prisma.audit.findFirst(args);
    }

    static async save(id: string, data: PrismaDTO.AuditUpdateInput): Promise<Audit> {
        return await prisma.audit.update({
            where: {
                id
            },
            data
        });
    }

    static async delete(id: string): Promise<Audit> {
        return await prisma.audit.delete({
            where: {
                id
            }
        });
    }
}
