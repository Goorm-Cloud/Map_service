#FROM python:3.10
#
#WORKDIR /app
#
#RUN apt-get update && apt-get install -y && rm -rf /var/lib/apt/lists/*
#
#COPY requirements.txt .
#RUN pip install --no-cache-dir -r requirements.txt
#RUN pip install --no-cache-dir pymysql
#RUN pip install --no-cache-dir gunicorn
#
#COPY . .
#COPY .env .env
#COPY config.py config.py
#
#ENV FLASK_APP=app.py
#ENV FLASK_ENV=production
#
#RUN export $(grep -v '^#' .env | sed 's/ *= */=/g' | tr '\n' ' ')
#
#EXPOSE 8002
#
#CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8002", "app:create_app()"]

FROM python:3.10

# 작업 디렉토리 설정
WORKDIR /app

# 최신 pip 설치
RUN pip install --upgrade pip

# 애플리케이션 코드 복사
COPY . .

# Jenkins에서 생성한 config.py 및 .env 파일을 컨테이너에 포함
# (Jenkins 파이프라인에서 config.py와 .env를 빌드 단계에서 생성하므로 Dockerfile에서는 별도로 복사하지 않음)

# 패키지 설치
RUN pip install -r requirements.txt

# Flask 관련 환경변수 설정
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Gunicorn 실행
CMD ["gunicorn", "--bind", "0.0.0.0:8002", "--workers", "4", "app:app"]