# syntax=docker/dockerfile:1

FROM python:3.8-slim-buster

ENV key=default_key
ENV backend=default_backend
ENV rps=15

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

CMD python3 main.py -key ${key} -b ${backend} -r ${rps}
