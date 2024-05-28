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

import { EStatusCode, Handler, Request, Response } from "midori/http";
import { HTTPError } from "midori/errors";
import { generateUUID, validateUUID } from "midori/util/uuid.js";
import { Auth } from "midori/auth";
import { Application } from "midori/app";
import { AuthServiceProvider } from "midori/providers";

import { prisma } from "@core/lib/Prisma.js";
import { BlogsConfig, BlogsConfigProvider } from "@app/providers/BlogsConfigProvider.js";
import { Channel, Item, rss } from "@core/rss.js";

export class Feed extends Handler {
    #blogsConfig?: BlogsConfig;

    constructor(app: Application) {
        super(app);

        this.#blogsConfig = app.config.get(BlogsConfigProvider);
    }

    override async handle(req: Request): Promise<Response> {
        if (!this.#blogsConfig) {
            throw new HTTPError('BlogsConfigProvider not found', EStatusCode.INTERNAL_SERVER_ERROR);
        }

        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' }
        });

        const feed = rss({
            title: this.#blogsConfig.name,
            link: this.#blogsConfig.url + '/index.rss',
            description: this.#blogsConfig.description,
            managingEditor: this.#blogsConfig.adminEmail,
            webMaster: this.#blogsConfig.adminEmail,
            pubDate: new Date(),
            generator: 'MidoriRSS/1.0',
            docs: 'https://www.rssboard.org/rss-specification',
            items: posts.map(post => (<Item> {
                title: post.title,
                link: `${this.#blogsConfig!.url}/posts/${post.id}`,
                description: post.resume,
                guid: {
                    value: post.id,
                    isPermaLink: false
                },
                pubDate: post.createdAt,
            })),
        });

        return Response.status(EStatusCode.OK)
            .withHeader('Content-Type', 'application/rss+xml')
            .send(feed);
    }
}

export class FeedByUser extends Handler {
    #blogsConfig?: BlogsConfig;

    constructor(app: Application) {
        super(app);

        this.#blogsConfig = app.config.get(BlogsConfigProvider);
    }

    override async handle(req: Request): Promise<Response> {
        if (!this.#blogsConfig) {
            throw new HTTPError('BlogsConfigProvider not found', EStatusCode.INTERNAL_SERVER_ERROR);
        }

        const username = req.params.get('username');

        const posts = await prisma.post.findMany({
            where: {
                user: {
                    username: username || undefined
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const feed = rss({
            title: this.#blogsConfig.name,
            link: this.#blogsConfig.url + '/@' + username + '.rss',
            description: this.#blogsConfig.description,
            items: posts.map(post => (<Item> {
                title: post.title,
                link: `${this.#blogsConfig!.url}/posts/${post.id}`,
                description: post.resume,
                guid: {
                    value: post.id,
                    isPermaLink: false
                },
                pubDate: post.createdAt,
            })),
        });

        return Response.status(EStatusCode.OK)
            .withHeader('Content-Type', 'application/rss+xml')
            .send(feed);
    }
}
