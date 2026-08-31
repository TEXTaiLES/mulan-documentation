# HTTP API

MulAn exposes stable resource endpoints under `/api/v1`, UI editing endpoints under `/api/internal/v1`, and a health endpoint at `/api/health`. API state is identified by UUIDs and does not depend on cookies.

!!! warning
    No endpoint is authenticated in MulAn v1. Apply access control outside the application before exposing it beyond a trusted single-user environment.

## Conventions

- JSON requests use `Content-Type: application/json`.
- Uploads use `multipart/form-data`; do not set its boundary manually.
- TIFF downloads use `image/tiff`, previews and overlays use `image/png`, and packages use `application/zip`.
- Channel indexes in URLs are zero-based. Class IDs are unsigned integers from `0` through `65535`.
- Successful deletion returns `204 No Content`.
- Boolean form/query fields accept `true`, `false`, `1`, `0`, `yes`, or `no`, case-insensitively.

Errors have one shape:

```json
{
  "error": {
    "code": "dimension_mismatch",
    "message": "All BMP images must have identical dimensions.",
    "details": {}
  }
}
```

Clients should branch on `error.code`, not the human-readable message. Common status meanings are `400` malformed input, `404` unknown resource, `409` state conflict, `413` request too large, `415` unsupported file type, `422` valid request with unsupported or inconsistent content, and `500` corrupt stored data or an unexpected server error.

## Endpoint summary

### Public API

| Method and path | Purpose |
| --- | --- |
| `POST /api/v1/convert/bmp-to-tiff` | Convert ordered BMP inputs to a TIFF download or image resource. |
| `POST /api/v1/images` | Upload a TIFF and create an image resource. |
| `GET /api/v1/images/{image_id}` | Read image metadata. |
| `GET /api/v1/images/{image_id}/file` | Download the unchanged source TIFF. |
| `GET /api/v1/images/{image_id}/channels/{channel_index}/preview` | Render one display preview. |
| `DELETE /api/v1/images/{image_id}` | Delete an image not referenced by an annotation. |
| `POST /api/v1/annotations` | Create an annotation from an image resource or direct TIFF upload. |
| `GET /api/v1/annotations/{annotation_id}` | Read annotation state and class statistics. |
| `GET /api/v1/annotations/{annotation_id}/mask` | Download the current canonical mask TIFF. |
| `PUT /api/v1/annotations/{annotation_id}/mask` | Replace the mask and optionally its class metadata. |
| `POST /api/v1/annotations/{annotation_id}/classes` | Add a class with the next stable ID. |
| `PATCH /api/v1/annotations/{annotation_id}/classes/{class_id}` | Edit a class. |
| `DELETE /api/v1/annotations/{annotation_id}/classes/{class_id}` | Delete a class and reset its pixels to 0. |
| `GET /api/v1/annotations/{annotation_id}/export` | Download a mask package, optionally including the source. |
| `DELETE /api/v1/annotations/{annotation_id}` | Delete an annotation and, for direct-upload annotations, its owned image. |

### UI editing API

| Method and path | Purpose |
| --- | --- |
| `POST /api/internal/v1/annotations/{annotation_id}/operations` | Apply one source-coordinate raster operation. |
| `POST /api/internal/v1/annotations/{annotation_id}/undo` | Undo the latest retained mask patch. |
| `POST /api/internal/v1/annotations/{annotation_id}/redo` | Redo the latest undone mask patch. |
| `POST /api/internal/v1/annotations/{annotation_id}/save` | Set `saved_revision` to the current revision. |
| `GET /api/internal/v1/annotations/{annotation_id}/overlay` | Render a transparent class-colour overlay. |
| `PATCH /api/internal/v1/annotations/{annotation_id}/class-order` | Replace class presentation order. |
| `POST /api/internal/v1/cleanup` | Remove resources older than the configured TTL. |

The internal namespace is implemented for the bundled browser client. Integrations may use it, but should pin a MulAn version and expect it to evolve independently of `/api/v1`.

## BMP conversion

Send repeated `files` fields in the desired band-group order. Grayscale contributes one band; RGB contributes three adjacent bands in R, G, B order. All files must have matching dimensions and compatible integer datatypes.

| Form field | Required | Contract |
| --- | --- | --- |
| `files` | yes | Repeated `.bmp` uploads, in output order. |
| `channel_names` | no | JSON array containing one string or `null` per **expanded output band**. |
| `manifest` | no | JSON object described below; cannot conflict with `channel_names`. |
| `response_mode` | no | `direct` (default) or `resource`. |
| `output_name` | no | Safe download filename; a TIFF extension is enforced. |

Direct response example:

```sh
curl -X POST \
  -F "files=@450.bmp" \
  -F "files=@550.bmp" \
  -F "files=@850.bmp" \
  -F 'channel_names=["450nm","550nm","850nm"]' \
  -F "response_mode=direct" \
  http://localhost:5000/api/v1/convert/bmp-to-tiff \
  --output multispectral.tif
```

A direct response is the TIFF and includes `X-Channel-Count`. With `response_mode=resource`, success is `201` and returns:

```json
{
  "image_id": "4b35bceb-a188-4d43-a348-a88704f95db5",
  "filename": "multispectral.tif",
  "width": 2048,
  "height": 1536,
  "channel_count": 3,
  "channel_names": ["450nm", "550nm", "850nm"],
  "download_url": "/api/v1/images/4b35bceb-a188-4d43-a348-a88704f95db5/file"
}
```

The advanced `manifest` form is:

```json
{
  "bands": [
    {"file_index": 0, "name": "450nm"},
    {"file_index": 1, "name": "visible"}
  ]
}
```

It must contain exactly one unique, in-range `file_index` entry per input file. A name assigned to an RGB file expands to `visible:R`, `visible:G`, and `visible:B`. The manifest may contain no top-level property other than `bands`.

## Image resources

Upload and retrieve metadata:

```sh
curl -X POST -F "file=@multispectral.tif" \
  http://localhost:5000/api/v1/images

curl http://localhost:5000/api/v1/images/IMAGE_ID
```

Successful upload returns `201` with:

```json
{
  "image_id": "IMAGE_ID",
  "filename": "multispectral.tif",
  "width": 2048,
  "height": 1536,
  "channel_count": 5,
  "dtype": "uint16",
  "channel_names": ["450nm", "550nm", "650nm", "750nm", "850nm"],
  "georeferenced": false
}
```

`dtype` is `mixed` when TIFF bands do not report one common datatype. `channel_names` preserves missing descriptions as `null`. `georeferenced` reports whether the source has a CRS.

Download the byte-preserved upload or request a zero-based channel preview:

```sh
curl -o original.tif http://localhost:5000/api/v1/images/IMAGE_ID/file
curl -o channel.png \
  "http://localhost:5000/api/v1/images/IMAGE_ID/channels/0/preview?max_size=800&normalization=percentile"
```

`max_size` must be 32–4096 and limits the larger output dimension without upscaling. `normalization` is `percentile` (2nd–98th percentile, default) or `minmax`. Preview resampling is bilinear and the result is an 8-bit grayscale PNG cached by image ID, channel, size, and normalization.

Deleting an image referenced by any active annotation returns `409 image_in_use`.

## Annotation resources

Create from an existing image:

```sh
curl -X POST -F "image_id=IMAGE_ID" \
  http://localhost:5000/api/v1/annotations
```

Or create from a direct upload:

```sh
curl -X POST -F "image=@multispectral.tif" \
  http://localhost:5000/api/v1/annotations
```

Exactly one of `image_id` and `image` is required. Either form may also include `mask=@mask.tif` and `metadata=@annotations.json`. A direct-upload annotation owns its created image; deleting that annotation also deletes the image. An annotation created from an existing `image_id` does not own it.

Annotation state includes dimensions, revision counters, classes, per-class pixel statistics, and history availability:

```json
{
  "annotation_id": "ANNOTATION_ID",
  "image_id": "IMAGE_ID",
  "filename": "multispectral.tif",
  "width": 2048,
  "height": 1536,
  "channel_count": 5,
  "revision": 7,
  "saved_revision": 6,
  "mask_dtype": "uint16",
  "classes": [
    {"id": 0, "name": "Background", "description": "", "color": "#000000", "order": 0},
    {"id": 1, "name": "Stain", "description": "", "color": "#735FA4", "order": 1}
  ],
  "statistics": [
    {"class_id": 0, "pixel_count": 3115000},
    {"class_id": 1, "pixel_count": 305728}
  ],
  "can_undo": true,
  "can_redo": false
}
```

The internal canonical mask is `uint16`; an exported mask is narrowed to `uint8` when its maximum ID is at most 255.

### Classes

Add a class with a non-empty name and six-digit hexadecimal colour:

```http
POST /api/v1/annotations/ANNOTATION_ID/classes
Content-Type: application/json
```

```json
{"name":"Stain","description":"Discoloured fibre","color":"#735FA4"}
```

The server assigns the ID and order. `PATCH` accepts only `name`, `description`, `color`, and `order`. Deleting class 0 is forbidden. Deleting another class changes exactly its pixels to Background, never renumbers IDs, increments the revision, and clears operation history.

Use the internal class-order endpoint to atomically reorder all classes:

```json
{"class_ids":[0,3,1,2]}
```

The array must contain every existing class ID exactly once.

### Mask import and replacement

```sh
curl -X PUT \
  -F "mask=@mask.tif" \
  -F "metadata=@annotations.json" \
  -F "overwrite=true" \
  http://localhost:5000/api/v1/annotations/ANNOTATION_ID/mask
```

`mask` may be a `.tif`, `.tiff`, or ZIP containing `mask.tif`; a package may also contain `annotations.json`. The raster must be a one-band integer GTiff with source-matching dimensions, non-negative values, and a maximum ID of 65535. Metadata must use format `mulan-semantic-segmentation`, version `1.0`, `background_id: 0`, and `ignore_id: null`.

When the current annotation has painted pixels or more than Background, replacement requires `overwrite=true` or returns `409 overwrite_required`. Replacement records one full-mask history patch with old and new class metadata.

## Editing operations and revisions

Drawing operations are optimistic: send the current `revision` as `base_revision`. A stale value returns `409 revision_conflict` with `details.current_revision`; fetch current annotation state before retrying or reconciling.

```http
POST /api/internal/v1/annotations/ANNOTATION_ID/operations
Content-Type: application/json
```

```json
{
  "base_revision": 7,
  "tool": "brush_add",
  "class_id": 1,
  "radius": 12,
  "points": [{"x": 120.5, "y": 85.0}, {"x": 124.0, "y": 88.5}]
}
```

Coordinates and radius are expressed in source pixels. Points must be finite numbers. Supported tools and minimum points are:

| Tool | Minimum points | Pixel effect |
| --- | ---: | --- |
| `brush_add` | 1 | Set selected pixels to `class_id`; requires positive finite `radius` within image extent. |
| `erase` | 1 | Set selected pixels equal to `class_id` to 0; also requires `radius`. |
| `lasso_add` | 3 | Fill polygon with `class_id`. |
| `lasso_subtract` | 3 | Set pixels equal to `class_id` inside polygon to 0. |
| `rectangle_add` | 2 | Fill the axis-aligned rectangle with `class_id`. |
| `rectangle_subtract` | 2 | Set pixels equal to `class_id` inside the rectangle to 0. |

Background (`class_id: 0`) cannot be active. Successful changes increment `revision` and return revision/history flags. A no-op does not increment it, but still clears an existing redo branch. History holds at most 50 compressed mask patches.

Undo and redo each increment the revision because they create a new current state. `save` does not persist elsewhere; it only sets `saved_revision = revision` after verifying that every mask ID has corresponding class metadata.

### Overlay

```http
GET /api/internal/v1/annotations/ANNOTATION_ID/overlay?max_size=1600&visible_ids=1,3
```

`max_size` must be 32–4096. `visible_ids` is an optional comma-separated integer set. The response is a transparent PNG; non-background class pixels use their class colour with alpha 130. Downsampling uses nearest-neighbour resampling to preserve labels.

## Export contract

```sh
curl -o annotation-mask.zip \
  "http://localhost:5000/api/v1/annotations/ANNOTATION_ID/export?include_image=false"
curl -o annotation.zip \
  "http://localhost:5000/api/v1/annotations/ANNOTATION_ID/export?include_image=true"
```

The package always contains `mask.tif` and `annotations.json`; `include_image=true` adds the unchanged source as `image.tif`. The mask is one band, has description `Semantic class ID`, and includes TIFF tags `MULAN_FORMAT`, `MULAN_VERSION`, and `BACKGROUND_ID`. Source CRS and affine transform are copied only when the source is georeferenced.

`annotations.json` has this canonical shape:

```json
{
  "format": "mulan-semantic-segmentation",
  "version": "1.0",
  "image": {
    "filename": "multispectral.tif",
    "width": 2048,
    "height": 1536,
    "channels": 5,
    "channel_names": ["450nm", "550nm", "650nm", "750nm", "850nm"]
  },
  "mask": {
    "filename": "mask.tif",
    "dtype": "uint8",
    "background_id": 0,
    "ignore_id": null
  },
  "classes": [
    {"id": 0, "name": "Background", "description": "", "color": "#000000"},
    {"id": 1, "name": "Stain", "description": "Discoloured fibre", "color": "#735FA4"}
  ]
}
```

## Cleanup and storage semantics

Resources live below `MULAN_DATA_DIR` and expire by directory modification time. Cleanup runs at application startup and on:

```http
POST /api/internal/v1/cleanup
```

The response is `{"removed": N}`. Expired annotations are removed first. An image is preserved while a surviving annotation references it. There is no authentication, database transaction, resource-list endpoint, or multi-instance locking in v1; consumers must retain UUIDs and download durable outputs themselves.

