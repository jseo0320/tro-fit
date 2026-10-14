"""Application setup only. Run with python -m uvicorn app.main:app."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from .core.errors import ServiceError
from .api.routes import router

app = FastAPI(title='Tro-Fit LLM API', version='0.1.0')
app.include_router(router)


@app.exception_handler(ServiceError)
async def service_error_handler(request: Request, exc: ServiceError):
    return JSONResponse(status_code=exc.status, content={'error': {'code': exc.code, 'message': exc.message}})


