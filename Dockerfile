#FROM nodesource/jessie:0.12.7
FROM cusspvz/node:0.10.45
#RUN apt-get update
#RUN apt-get install git imagemagick libcairo2-dev libjpeg62-turbo-dev libpango1.0-dev libgif-dev build-essential g++ wget python-pip python-matplotlib -y
RUN apk update
RUN apk add imagemagick git cairo libjpeg pango g++ wget gcc
RUN sh -c "cd /tmp && wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz && tar xJf ffmpeg-release-amd64-static.tar.xz && cd ffmpeg-4.2.2-amd64-static && mv ffmpeg ffprobe /usr/local/bin"
# cache package.json and node_modules to speed up builds

RUN mkdir -p /app
WORKDIR /app
COPY . /app
#ADD package.json package.json
#RUN npm install
#COPY node_modules node_modules
#COPY . /app
#RUN  rm -rf /app/node_modules/bcrypt/node_modules/bindings/
#RUN npm i bcrypt@1.0.3
#RUN  rm -rf /app/node_modules/geoip/node_modules/bindings/
#RUN npm i geoip
#RUN python stickers.py
#RUN python banners.py
#COPY requirements.txt requirements.txt
RUN apk add py2-pip
RUN wget https://bootstrap.pypa.io/get-pip.py
RUN python get-pip.py
RUN pip install -r requirements.txt
#RUN python tripflags.py
#RUN python graph.py
EXPOSE 5080


