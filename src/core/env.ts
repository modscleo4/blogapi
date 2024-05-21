/**
 * Copyright 2024 Dhiego Cassiano Fogaça Barbosa
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

import { z } from 'zod';
import { JWEAlgorithm, JWEEncryption } from 'midori/util/jwe.js';
import { JWSAlgorithm } from 'midori/util/jws.js';

const envSchema = z.object({
    NODE_ENV: z.string().optional(),

    DATABASE_URL: z.string(),
    PORT: z.coerce.number().max(65535).optional(),

    EXPOSE_ERRORS: z.coerce.boolean().optional(),

    JWS_ALGORITHM: z.nativeEnum(JWSAlgorithm).optional(),
    JWS_SECRET: z.string().optional(),
    JWS_PUBLIC_KEY: z.string().optional(),
    JWS_PRIVATE_KEY: z.string().optional(),

    JWE_ALGORITHM: z.nativeEnum(JWEAlgorithm).optional(),
    JWE_ENCRYPTION: z.nativeEnum(JWEEncryption).optional(),
    JWE_SECRET: z.string().optional(),
    JWE_PUBLIC_KEY: z.string().optional(),
    JWE_PRIVATE_KEY: z.string().optional(),

    CORS_ORIGIN: z.string().optional(),

    OAUTH2_CLIENT_ID: z.string().optional(),
    OAUTH2_CLIENT_SECRET: z.string().optional(),
    OAUTH2_REDIRECT_URI: z.string().optional(),
    OAUTH2_AUTHORIZATION_URI: z.string().optional(),
    OAUTH2_TOKEN_URI: z.string().optional(),
    OAUTH2_USERINFO_URI: z.string().optional(),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_SECURE: z.coerce.boolean().optional(),
    SMTP_FROM: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),

    BLOGS_URL: z.string(),

    MAX_WORKERS: z.coerce.number().min(1).optional(),
});

export default envSchema.parse(process.env);
