# Image annotator

The Annotator creates a semantic-segmentation mask aligned with a multispectral TIFF. Every source pixel stores one integer class ID. The displayed spectral channel is only a backdrop, so switching channels never changes the annotation.

## Start an annotation

Open **Annotator** and upload a `.tif` or `.tiff` file, or select **Open in Annotator** from the Viewer. MulAn creates an empty mask containing only class `0`, **Background**.

The workspace has three parts:

- the tool rail on the left;
- the image and colour overlay in the centre; and
- mask import, semantic classes, save, and export controls on the right.

Use the channel and zoom controls above the canvas to change the backdrop, zoom, or fit the image. Select **Pan** before dragging the canvas to reposition it.

## Create and manage classes

1. Select **Add class**.
2. Give the class a name, optional description, and display colour.
3. Select the new class row to make it active.
4. Draw with one of the tools.

Class IDs are stable integers. New IDs increase monotonically and deleted IDs are not reused in the same annotation. Background is always ID `0`; it cannot be selected for drawing or deleted. MulAn v1 supports IDs through `65535`.

Use the eye button to hide a class from the on-screen overlay. Visibility is a viewing preference only: hidden classes remain in the mask and exports. You may edit a class or reorder the list without changing its ID.

!!! warning
    Deleting a class changes all of its pixels to Background and clears drawing undo/redo history. Confirm that you no longer need that class before deleting it.

## Drawing tools and shortcuts

| Tool | Shortcut | Behaviour |
| --- | --- | --- |
| Pan | `H` | Drag the canvas without editing the mask. |
| Brush | `B` | Paint the active class. New paint replaces any class already under the stroke. |
| Eraser | `E` | Change pixels of the active class under the stroke to Background. Other classes are left unchanged. |
| Lasso Add | `L` | Enclose an area and assign it to the active class. |
| Lasso Subtract | `Shift+L` | Change the active class inside the enclosed area to Background. |
| Rectangle Add | `R` | Assign the dragged rectangle to the active class. |
| Rectangle Subtract | `Shift+R` | Change the active class inside the rectangle to Background. |

The vertical slider at the bottom of the tool rail changes the Brush and Eraser radius in source pixels. The UI offers 1–80 px.

Undo with the toolbar or `Ctrl+Z` / `Cmd+Z`. Redo with `Ctrl+Shift+Z`, `Cmd+Shift+Z`, `Ctrl+Y`, or `Cmd+Y`. Starting a new drawing operation after Undo discards the redo branch. Up to 50 mask-operation patches are retained for the current annotation.

## Apply an existing mask

Select **Apply Mask** or drop files onto the class panel. You can provide:

- a single-band `.tif` or `.tiff` mask;
- a MulAn `.zip` package containing `mask.tif` and optionally `annotations.json`; or
- a TIFF mask together with its separate `annotations.json` file.

The mask must have exactly the same width and height as the source, contain exactly one integer band, use non-negative IDs no greater than `65535`, and reserve `0` for Background. When no metadata is supplied, MulAn creates placeholder classes for IDs found in the mask.

If the current annotation already contains a non-background class or painted pixels, MulAn asks for confirmation before replacing it. A successful mask replacement can be undone and redone together with its imported class metadata.

## Save and export

The revision label shows whether the current server-side revision is marked as saved. Select **Save changes** to mark it saved and open the export choices:

- **Download Mask** produces a ZIP with `mask.tif` and `annotations.json`;
- **Download Image + Mask** adds the byte-preserved source as `image.tif`.

The exported `mask.tif` has one band named `Semantic class ID`. It uses `uint8` when all IDs fit in 0–255 and `uint16` otherwise. If the source has a coordinate reference system, the mask receives its CRS and affine transform; MulAn does not invent georeferencing for an unreferenced source.

!!! important
    Save is a revision checkpoint, not durable archival storage. Images and annotations remain subject to the server's resource lifetime. Download an export package before leaving the work unattended.

Navigation and browser-close warnings appear when the revision is not marked as saved. There are no accounts or collaborative locks in MulAn v1.

## Export package metadata

`annotations.json` identifies the format as `mulan-semantic-segmentation` version `1.0`. It records source dimensions and channels, mask datatype and background ID, and each class's stable ID, name, description, and colour. Display visibility and class list order are not part of the exported class objects.

