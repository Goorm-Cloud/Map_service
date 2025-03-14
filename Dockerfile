FROM python:3.10

WORKDIR /app

RUN apt-get update && apt-get install -y && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir pymysql
RUN pip install --no-cache-dir gunicorn

COPY . .
COPY .env .env
COPY config.py config.py

ENV FLASK_APP=app.py
ENV FLASK_ENV=production

RUN export $(grep -v '^#' .env | sed 's/ *= */=/g' | tr '\n' ' ')

EXPOSE 8002

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8002", "app:create_app()"]