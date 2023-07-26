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

export default class PostVoteValidationMiddleware extends ValidationMiddleware {
    get rules(): ValidatonRules {
        const voteValues = ['UPVOTE', 'DOWNVOTE'];

        return {
            kind: {
                type: 'string',
                required: true,
                nullable: false,
                customValidations: [
                    {
                        validator: (value: string) => voteValues.includes(value),
                        message: `The kind must be one of: ${voteValues.join(', ')}.`
                    },
                ],
            },
        };
    }
}
