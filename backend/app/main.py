import logging
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()

    logging.basicConfig(
        level=(
            logging.DEBUG
            if settings.app_env == "development"
            else logging.INFO
        ),
        format=(
            "%(asctime)s %(levelname)s "
            "%(name)s %(message)s"
        ),
    )

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def request_context(
        request: Request,
        call_next,
    ):
        request_id = (
            request.headers.get("X-Request-ID")
            or uuid4().hex
        )

        started_at = perf_counter()
        response = await call_next(request)

        duration_ms = round(
            (perf_counter() - started_at) * 1000,
            2,
        )

        response.headers["X-Request-ID"] = request_id

        logging.getLogger("marciotopbarber").info(
            "method=%s path=%s status=%s "
            "request_id=%s duration_ms=%s",
            request.method,
            request.url.path,
            response.status_code,
            request_id,
            duration_ms,
        )

        return response

    application.include_router(router)

    return application


app = create_app()
