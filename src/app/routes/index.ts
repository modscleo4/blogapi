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

import { Router as RouterBuilder } from "midori/router";
import { Response } from "midori/http";
import { CORSMiddleware } from "midori/middlewares";

import Oauth2Handler from "@app/handler/Oauth2Handler.js";
import * as AuthHandler from "@app/handler/AuthHandler.js";
import * as PostHandler from "@app/handler/PostHandler.js";
import * as ReplyHandler from "@app/handler/ReplyHandler.js";
import * as UserHandler from "@app/handler/UserHandler.js";
import * as PostVoteHandler from "@app/handler/PostVoteHandler.js";
import * as ReplyVoteHandler from "@app/handler/ReplyVoteHandler.js";

import AuthBearerMiddleware from "@app/middleware/AuthBearerMiddleware.js";
import * as Oauth2LoginHandler from "@app/handler/Oauth2LoginHandler.js";

import PostCreateValidationMiddleware from "@app/middleware/validations/PostCreateValidationMiddleware.js";
import PostUpdateValidationMiddleware from "@app/middleware/validations/PostUpdateValidationMiddleware.js";
import PostPatchValidationMiddleware from "@app/middleware/validations/PostPatchValidationMiddleware.js";
import ReplyCreateValidationMiddleware from "@app/middleware/validations/ReplyCreateValidationMiddleware.js";
import ReplyPatchValidationMiddleware from "@app/middleware/validations/ReplyPatchValidationMiddleware.js";
import ReplyUpdateValidationMiddleware from "@app/middleware/validations/ReplyUpdateValidationMiddleware.js";
import AuthRegisterValidationMiddleware from "@app/middleware/validations/AuthRegisterValidationMiddleware.js";
import VoteValidationMiddleware from "@app/middleware/validations/VoteValidationMiddleware.js";

import OauthScopeMiddlewareFactory from "@app/middleware/OauthScopeMiddleware.js";

import addSwaggerRoutes from "@swagger-ui/swagger.router.js";

const OauthScopeWritePostsMiddleware = OauthScopeMiddlewareFactory({ scopes: ['write:posts'] });
const OauthScopeVotePostsMiddleware = OauthScopeMiddlewareFactory({ scopes: ['vote:posts'] });
const OauthScopeDeletePostsMiddleware = OauthScopeMiddlewareFactory({ scopes: ['delete:posts'] });

const OauthScopeWriteRepliesMiddleware = OauthScopeMiddlewareFactory({ scopes: ['write:replies'] });
const OauthScopeVoteRepliesMiddleware = OauthScopeMiddlewareFactory({ scopes: ['vote:replies'] });
const OauthScopeDeleteRepliesMiddleware = OauthScopeMiddlewareFactory({ scopes: ['delete:replies'] });

const Router = new RouterBuilder();

/**
 * Routing
 *
 * Define your routes here
 * Use the Router.get(), Router.post(), Router.put(), Router.patch(), Router.delete() methods to define your routes
 * Use the Router.group() method to group routes under a common prefix
 * Use the Router.route() method to define a route using a custom HTTP method
 */

addSwaggerRoutes(Router);
Router.get('/', async () => Response.redirect('/docs')).withName('home');

Router.post('/auth/register', AuthHandler.Register, [AuthRegisterValidationMiddleware]).withName('auth.register');
Router.get('/auth/verify', AuthHandler.VerifyEmail).withName('auth.verify');
Router.get('/auth/user', AuthHandler.User, [AuthBearerMiddleware]).withName('auth.user');

Router.post('/oauth/token', Oauth2Handler).withName('oauth.token');
Router.get('/oauth/login', Oauth2LoginHandler.Login).withName('oauth.login');
Router.post('/oauth/callback', Oauth2LoginHandler.Callback).withName('oauth.callback');

Router.group('/api/v1', () => {
    Router.group('/user', () => {
        Router.group('/{id}', () => {
            Router.get('/', UserHandler.Show).withName('user.show');
        });
    });

    Router.group('/post', () => {
        Router.get('/', PostHandler.List).withName('post.list');
        Router.post('/', PostHandler.Create, [AuthBearerMiddleware, OauthScopeWritePostsMiddleware, PostCreateValidationMiddleware]).withName('post.create');

        Router.group('/{id}', () => {
            Router.get('/', PostHandler.Show).withName('post.show');
            Router.put('/', PostHandler.Update, [AuthBearerMiddleware, OauthScopeWritePostsMiddleware, PostUpdateValidationMiddleware]).withName('post.update');
            Router.patch('/', PostHandler.Patch, [AuthBearerMiddleware, OauthScopeWritePostsMiddleware, PostPatchValidationMiddleware]).withName('post.patch');
            Router.delete('/', PostHandler.Destroy, [AuthBearerMiddleware, OauthScopeDeletePostsMiddleware]).withName('post.destroy');

            Router.group('/vote', () => {
                Router.get('/', PostVoteHandler.Show, [AuthBearerMiddleware, OauthScopeVotePostsMiddleware]).withName('post.vote.show');
                Router.put('/', PostVoteHandler.Update, [AuthBearerMiddleware, OauthScopeVotePostsMiddleware, VoteValidationMiddleware]).withName('post.vote.update');
                Router.delete('/', PostVoteHandler.Destroy, [AuthBearerMiddleware, OauthScopeVotePostsMiddleware]).withName('post.vote.destroy');
            });
        });

        Router.post('/{postId}/reply', ReplyHandler.Create, [AuthBearerMiddleware, OauthScopeWriteRepliesMiddleware, ReplyCreateValidationMiddleware]).withName('post.reply.create');
    });

    Router.group('/reply', () => {
        Router.group('/{id}', () => {
            Router.get('/', ReplyHandler.Show).withName('reply.show');
            Router.put('/', ReplyHandler.Update, [AuthBearerMiddleware, OauthScopeWriteRepliesMiddleware, ReplyUpdateValidationMiddleware]).withName('reply.update');
            Router.patch('/', ReplyHandler.Patch, [AuthBearerMiddleware, OauthScopeWriteRepliesMiddleware, ReplyPatchValidationMiddleware]).withName('reply.patch');
            Router.delete('/', ReplyHandler.Destroy, [AuthBearerMiddleware, OauthScopeDeleteRepliesMiddleware]).withName('reply.destroy');

            Router.group('/vote', () => {
                Router.get('/', ReplyVoteHandler.Show, [AuthBearerMiddleware, OauthScopeVoteRepliesMiddleware]).withName('reply.vote.show');
                Router.put('/', ReplyVoteHandler.Update, [AuthBearerMiddleware, OauthScopeVoteRepliesMiddleware, VoteValidationMiddleware]).withName('reply.vote.update');
                Router.delete('/', ReplyVoteHandler.Destroy, [AuthBearerMiddleware, OauthScopeVoteRepliesMiddleware]).withName('reply.vote.destroy');
            });
        });

        Router.post('/{replyId}/reply', ReplyHandler.Create, [AuthBearerMiddleware, OauthScopeWriteRepliesMiddleware, ReplyCreateValidationMiddleware]).withName('reply.create');
    });
});

export default Router;
