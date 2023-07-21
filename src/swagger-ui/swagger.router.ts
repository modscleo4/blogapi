import { Response } from "midori/http";
import { Router } from "midori/router";

export default function addSwaggerRoutes(Router: Router): void {
    Router.get('/docs', async (req, app) => Response.file('src/swagger-ui/index.html'));
    Router.get('/openapi.yml', async (req, app) => Response.file('./openapi.yml'));
}
