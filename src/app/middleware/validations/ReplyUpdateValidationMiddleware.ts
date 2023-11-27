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

export default class PostUpdateValidationMiddleware extends ValidationMiddleware {
    get rules(): ValidatonRules {
        return {
            content: {
                type: 'object',
                required: true,
                nullable: false,
                customValidations: [
                    {
                        validator: (value: object) => {
                            if (!value || !('blocks' in value)) {
                                return false;
                            }

                            if (typeof value.blocks !== 'object' || !Array.isArray(value.blocks)) {
                                return false;
                            }

                            for (const block of value.blocks) {
                                if (
                                    typeof block !== 'object'
                                    || !block.type || typeof block.type !== 'string'
                                    || !block.data || typeof block.data !== 'object'
                                ) {
                                    return false;
                                }
                            }

                            return true;
                        },
                        message: 'Invalid content structure.'
                    }
                ],
            },
        };
    }
}
