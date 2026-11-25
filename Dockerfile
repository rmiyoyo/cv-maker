FROM node:26-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM golang:1.26-alpine AS server
WORKDIR /server
COPY server/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /cv-maker .

FROM gcr.io/distroless/static-debian12
COPY --from=server /cv-maker /cv-maker
COPY --from=web /web/dist /static
ENV STATIC_DIR=/static PORT=8080
EXPOSE 8080
USER nonroot
ENTRYPOINT ["/cv-maker"]
