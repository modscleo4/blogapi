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

// Manage the multiple threads of the application

import cluster from "cluster";
import { cpus } from "os";
import dotenv from 'dotenv';

dotenv.config({ });

if (process.env.NODE_ENV?.toUpperCase() !== 'PRODUCTION') {
    dotenv.config({ path: './.env.dev' });
}

if (cluster.isPrimary) {
    const maxWorkers = process.env.MAX_WORKERS ? parseInt(process.env.MAX_WORKERS) : cpus().length;
    for (let i = 0; i < maxWorkers; i++) {
        cluster.fork().on('exit', function onExit(code, signal) {
            console.error(`Worker ${i} died with code ${code} and signal ${signal}`);

            // Try to start a new worker
            cluster.fork().on('exit', onExit);
        });
    }
} else {
    console.log(`Worker ${process.pid} started`);
    await import('./server.js');
}
