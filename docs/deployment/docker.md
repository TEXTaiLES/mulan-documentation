# Docker deployment

MulAn ships as one container. A Node build stage compiles the React interface; a Python 3.12 runtime serves that interface and both Flask API namespaces through Gunicorn.

## Requirements

- Docker Engine or Docker Desktop; and
- the Docker Compose plugin (`docker compose`).

## Start MulAn

From the MulAn application repository root:

```sh
docker compose up --build -d
```

Open <http://localhost:5000>. Check the deployment with:

```sh
docker compose ps
docker compose logs -f mulan
curl http://localhost:5000/api/health
```

The health endpoint should return:

```json
{"status":"ok"}
```

Stop the service without deleting its volume:

```sh
docker compose down
```

## Configuration

Compose reads these optional values from a `.env` file beside `compose.yaml`:

| Variable | Default | Meaning |
| --- | ---: | --- |
| `MULAN_RESOURCE_TTL_HOURS` | `24` | Age after which temporary resources are eligible for cleanup. Decimal values are accepted. |
| `MULAN_MAX_UPLOAD_MB` | `512` | Maximum size of one HTTP request, in MiB. A multi-file conversion shares this request limit. |

Inside the supplied container, `MULAN_DATA_DIR` is fixed to `/data` and backed by the `mulan-data` named volume. To use another container path or mount, change both the environment entry and volume mapping in `compose.yaml`.

After changing configuration, recreate the service:

```sh
docker compose up -d --build --force-recreate
```

## Data and resource lifetime

The `mulan-data` volume contains uploaded sources, cached previews, annotation masks, metadata, exports, and undo/redo patches. Container recreation preserves the named volume. This volume is working storage, not a user-facing archive.

On application startup, MulAn removes resources older than the configured TTL. Cleanup removes expired annotations before images, and preserves an old image while a non-expired annotation still references it. The UI-only cleanup endpoint can also trigger the same process.

Directory modification time is used for expiry. Download important results before the TTL and use an infrastructure-level volume backup if a recovery window is required.

!!! danger
    `docker compose down -v` deletes the `mulan-data` volume and its stored resources. Use it only when that data is intentionally disposable.

## Reverse proxy and production exposure

The image exposes Gunicorn on port `5000` with two workers and four threads per worker. Put an internet-facing instance behind a reverse proxy that provides TLS, request timeouts suitable for large raster uploads, and an upload-size limit consistent with `MULAN_MAX_UPLOAD_MB`.

MulAn v1 assumes it is served at the origin root: the client uses absolute paths such as `/api/...` and `/assets/...`. A dedicated hostname is simpler than mounting it below a URL prefix.

!!! warning
    MulAn v1 has no authentication or authorization. Public and UI editing endpoints can create, change, export, and delete resources; the internal cleanup route can delete expired resources. Restrict access at the reverse proxy or network boundary. Do not expose an unprotected instance to the public internet.

MulAn is designed for a single user. Its filesystem resources do not use cross-worker or multi-instance locks. Do not scale multiple containers against one shared data directory, and avoid simultaneous edits to the same annotation. API clients should still use revision checks for drawing operations.

## Updates and backups

Before updating:

1. download required mask packages from the application;
2. back up the `mulan-data` volume if server-side recovery is needed;
3. pull or check out the intended MulAn revision; and
4. rebuild and recreate the service.

For a simple local backup, use your Docker platform's documented named-volume backup procedure. Verify recovery with a copy of the volume rather than modifying the live data.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Port 5000 is unavailable | Change the host side of `5000:5000`, for example to `8080:5000`, then browse to port 8080. |
| HTTP 413 or `upload_too_large` | Raise `MULAN_MAX_UPLOAD_MB` and the reverse proxy's request limit, then recreate the service. |
| Resources disappear after restart | Check the TTL and confirm that the `mulan-data` volume is attached. Startup cleanup is expected. |
| Container is unhealthy | Inspect `docker compose logs mulan` and request `/api/health` from the host. |
| Viewer loads but an image does not | Confirm the input is an ordinary Rasterio-compatible TIFF rather than an unsupported OME/hyperstack layout. |

