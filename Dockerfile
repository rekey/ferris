FROM  alpine
LABEL maintainer="Rekey <rekey@me.com>"

WORKDIR /app/
ENV TZ=Asia/Shanghai
COPY --from=teddysun/xray /usr/bin/xray /usr/bin/xray
COPY --from=teddysun/xray /usr/share/xray /usr/share/xray
ADD ./src /app/

RUN sed -i "s@http://dl-cdn.alpinelinux.org/@https://repo.huaweicloud.com/@g" /etc/apk/repositories && \
    apk update && \
    apk add nodejs npm curl && \
    xray help && \
    node -v && \
    npm --verb i

# ENTRYPOINT [ "./docker-entrypoint.sh" ]

VOLUME /app/store
VOLUME /app/config
VOLUME /app/log
EXPOSE 60001

CMD ["node", "start.js"]
