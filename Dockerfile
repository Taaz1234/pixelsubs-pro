FROM python:3.11-slim

WORKDIR /app

COPY . /app

EXPOSE 8098

CMD ["python", "server.py"]
