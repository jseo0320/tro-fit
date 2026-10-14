FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements-docker.txt .
RUN pip install --no-cache-dir -r requirements-docker.txt
COPY app ./app
RUN useradd --uid 10001 --create-home appuser
USER appuser
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
