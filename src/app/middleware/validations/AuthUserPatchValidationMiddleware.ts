/**
 * Copyright 2022 Dhiego Cassiano Fogaça Barbosa
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

import { ValidationMiddleware } from "midori/middlewares";
import { ValidatonRules } from "midori/util/validation.js";

export default class AuthUserPatchValidationMiddleware extends ValidationMiddleware {
    override get rules(): ValidatonRules {
        return {
            username: {
                type: 'string',
                required: false,
                nullable: false,
            },
            email: {
                type: 'string',
                required: false,
                nullable: false,
            },
            name: {
                type: 'string',
                required: false,
                nullable: false,
            },
            bio: {
                type: 'string',
                required: false,
                nullable: true,
            },
            password: {
                type: 'string',
                required: false,
                nullable: false,
            },
        };
    }
}
