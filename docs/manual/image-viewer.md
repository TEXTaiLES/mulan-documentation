# Image viewer

The Viewer lets you inspect a multiband TIFF without changing the original raster.

## Open an image

Open **Viewer**, then drop a `.tif` or `.tiff` file into the upload area. You can also select **Open in Viewer** after a conversion. MulAn accepts ordinary one-or-more-band TIFF rasters supported by Rasterio.

Once loaded, the header shows the filename, dimensions, number of channels, datatype, and the current band description when one is available.

## Single-channel view

In **Single Channel** mode:

- use **Previous** and **Next**, or the left and right arrow keys, to change channels;
- use **Zoom in** and **Zoom out** to adjust the view;
- use **Fit to viewport** to reset the view; and
- when zoomed in, drag inside the viewport to pan across the image.

The Viewer limits its interactive zoom to 25%–800%. Keyboard channel changes are ignored while you are typing in a form field.

## Grid view

Select **Grid** to display all channels as thumbnails. Each tile shows its channel number and, when present, its channel name. Select a tile to return to Single Channel mode with that channel active.

Large datasets may take a moment because thumbnail previews are created on demand and then cached by the server.

## Understanding the preview

MulAn produces an 8-bit grayscale PNG for display. By default, values between the 2nd and 98th percentiles of the selected band are stretched across the visible range; values outside that range are clipped. Large images are downsampled for the preview.

!!! important
    The normalization, grayscale rendering, and downsampling affect only the preview. Downloading the image returns the original uploaded bytes.

A channel that looks blank may contain a constant value, no finite values, or very little contrast after normalization. This does not mean the stored TIFF was changed.

## Continue to annotation

Select **Open in Annotator** to reuse the currently uploaded image. The Annotator can switch spectral channels while keeping one common semantic mask aligned to the source pixels.

Uploaded images are temporary. The Viewer is not a persistent image library; retain the original file outside MulAn.

