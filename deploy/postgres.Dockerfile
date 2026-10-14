FROM postgres:16-alpine
RUN apk add --no-cache --virtual .vector-build build-base git \
    && git clone --branch v0.8.6 --depth 1 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector && make with_llvm=no && make with_llvm=no install \
    && cd / && rm -rf /tmp/pgvector && apk del .vector-build
