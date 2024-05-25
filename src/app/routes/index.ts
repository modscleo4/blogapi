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
import { AuthMiddleware, CORSMiddleware } from "midori/middlewares";

import * as Oauth2Handler from "@app/handler/Oauth2Handler.js";
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
import AuthUserUpdateValidationMiddleware from "@app/middleware/validations/AuthUserUpdateValidationMiddleware.js";
import AuthUserPatchValidationMiddleware from "@app/middleware/validations/AuthUserPatchValidationMiddleware.js";
import VoteValidationMiddleware from "@app/middleware/validations/VoteValidationMiddleware.js";

import OauthScopeMiddlewareFactory from "@app/middleware/OauthScopeMiddleware.js";

import { addSwaggerRoutes } from "midori-swaggerui";

const OauthScopeWriteProfileMiddleware = OauthScopeMiddlewareFactory({ scopes: ['write:profile'] });

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
 * Use the Router.get(), Router.post(), Router.put(), Router.patch(), Router.delete() methods to define your routes.
 * Use the Router.group() method to group routes under a common prefix.
 * Use the Router.route() method to define a route using a custom HTTP method.
 *
 * Beware of trailing slashes! The Dispatcher Middleware will NOT remove nor add trailing slashes to the request path
 * `GET /foo` and `GET /foo/` are different routes and will be dispatched to different handlers.
 *
 * You can add an parameter to the path by using the {parameterName} syntax. The parameter will be available in the params property of the Request.
 *
 * Example:
 * Router.get('/user/{id}', UserHandler.Show).withName('user.show');
 */

addSwaggerRoutes(Router);
Router.get('/', async () => Response.redirect('/docs')).withName('home');

Router.group('/auth', () => {
    Router.post('/register', AuthHandler.Register, [AuthRegisterValidationMiddleware]).withName('auth.register');

    Router.group('/email', () => {
        Router.post('/verify', AuthHandler.RequestEmailVerification, [AuthBearerMiddleware, AuthMiddleware]).withName('auth.email.requestVerification');
        Router.get('/verify', AuthHandler.VerifyEmail).withName('auth.email.verify');
    });

    Router.group('/user', () => {
        Router.get('', AuthHandler.ShowUser, [AuthBearerMiddleware, AuthMiddleware]).withName('auth.user.show');
        Router.put('', AuthHandler.UpdateUser, [AuthBearerMiddleware, AuthMiddleware, OauthScopeWriteProfileMiddleware, AuthUserUpdateValidationMiddleware]).withName('auth.user.update');
        Router.patch('', AuthHandler.PatchUser, [AuthBearerMiddleware, AuthMiddleware, OauthScopeWriteProfileMiddleware, AuthUserPatchValidationMiddleware]).withName('auth.user.patch');
    });
});

Router.get('/.well-known/jwks.json', Oauth2Handler.ListKeys).withName('oauth.jwks');
Router.post('/oauth/token', Oauth2Handler.Token).withName('oauth.token');
Router.get('/oauth/login', Oauth2LoginHandler.Login).withName('oauth.login');
Router.post('/oauth/callback', Oauth2LoginHandler.Callback).withName('oauth.callback');

Router.group('/api/v1', () => {
    Router.group('/user', () => {
        Router.group('/@{username}', () => {
            Router.get('', UserHandler.ShowByUsername).withName('user.showByUsername');
        });

        Router.group('/{id}', () => {
            Router.get('', UserHandler.Show).withName('user.show');
        });
    });

    Router.group('/post', () => {
        Router.get('', PostHandler.List).withName('post.list');
        Router.post('', PostHandler.Create, [AuthBearerMiddleware, AuthMiddleware, OauthScopeWritePostsMiddleware, PostCreateValidationMiddleware]).withName('post.create');

        Router.group('/{id}', () => {
            Router.get('', PostHandler.Show).withName('post.show');
            Router.put('', PostHandler.Update, [AuthBearerMiddleware, AuthMiddleware, OauthScopeWritePostsMiddleware, PostUpdateValidationMiddleware]).withName('post.update');
            Router.patch('', PostHandler.Patch, [AuthBearerMiddleware, AuthMiddleware, OauthScopeWritePostsMiddleware, PostPatchValidationMiddleware]).withName('post.patch');
            Router.delete('', PostHandler.Destroy, [AuthBearerMiddleware, AuthMiddleware, OauthScopeDeletePostsMiddleware]).withName('post.destroy');

            Router.group('/vote', () => {
                Router.get('', PostVoteHandler.Show, [AuthBearerMiddleware, AuthMiddleware]).withName('post.vote.show');
                Router.put('', PostVoteHandler.Update, [AuthBearerMiddleware, AuthMiddleware, OauthScopeVotePostsMiddleware, VoteValidationMiddleware]).withName('post.vote.update');
                Router.delete('', PostVoteHandler.Destroy, [AuthBearerMiddleware, AuthMiddleware, OauthScopeVotePostsMiddleware]).withName('post.vote.destroy');
            });
        });

        Router.post('/{postId}/reply', ReplyHandler.Create, [AuthBearerMiddleware, AuthMiddleware, OauthScopeWriteRepliesMiddleware, ReplyCreateValidationMiddleware]).withName('post.reply.create');
    });

    Router.group('/reply', () => {
        Router.group('/{id}', () => {
            Router.get('', ReplyHandler.Show).withName('reply.show');
            Router.put('', ReplyHandler.Update, [AuthBearerMiddleware, AuthMiddleware, OauthScopeWriteRepliesMiddleware, ReplyUpdateValidationMiddleware]).withName('reply.update');
            Router.patch('', ReplyHandler.Patch, [AuthBearerMiddleware, AuthMiddleware, OauthScopeWriteRepliesMiddleware, ReplyPatchValidationMiddleware]).withName('reply.patch');
            Router.delete('', ReplyHandler.Destroy, [AuthBearerMiddleware, AuthMiddleware, OauthScopeDeleteRepliesMiddleware]).withName('reply.destroy');

            Router.group('/vote', () => {
                Router.get('', ReplyVoteHandler.Show, [AuthBearerMiddleware, AuthMiddleware]).withName('reply.vote.show');
                Router.put('', ReplyVoteHandler.Update, [AuthBearerMiddleware, AuthMiddleware, OauthScopeVoteRepliesMiddleware, VoteValidationMiddleware]).withName('reply.vote.update');
                Router.delete('', ReplyVoteHandler.Destroy, [AuthBearerMiddleware, AuthMiddleware, OauthScopeVoteRepliesMiddleware]).withName('reply.vote.destroy');
            });
        });

        Router.post('/{replyId}/reply', ReplyHandler.Create, [AuthBearerMiddleware, AuthMiddleware, OauthScopeWriteRepliesMiddleware, ReplyCreateValidationMiddleware]).withName('reply.create');
    });
});

export default Router;
