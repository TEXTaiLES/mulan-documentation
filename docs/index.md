# MulAn documentation

<p align="center">
  <img src="assets/mulan-mark.svg" alt="MulAn" width="150"/>
</p>

**MulAn** is a browser-based multispectral image viewer and semantic annotator. It brings three connected tasks into one focused application:

- converting ordered grayscale or RGB BMP files into a multiband TIFF;
- inspecting the channels of a multispectral TIFF; and
- drawing pixel-aligned semantic classes and exporting machine-learning-ready masks.

MulAn is a single-user tool. It does not require an account, and it keeps uploaded images and annotations as temporary server-side resources. See [Docker deployment](deployment/docker.md#data-and-resource-lifetime) before using it with important data.

## What is a multispectral image?

A normal colour photograph usually records red, green, and blue values. A **multispectral image** records several aligned images, or *spectral channels*, of the same subject at different wavelength ranges. Depending on the acquisition system, these may include visible light as well as ultraviolet or infrared wavelengths.

Because every channel describes the same scene, comparing them can reveal material or surface features that are weak or invisible in ordinary colour. A multiband TIFF stores the aligned channels as bands in one raster. The channel order and names therefore matter: a value such as `850nm` explains what a band represents, while its position determines where software finds it.

MulAn displays each TIFF band as a normalized grayscale preview. Normalization makes its contrast visible on screen; it does not alter the source pixels. Similarly, annotations live in source-image coordinates, so changing the displayed channel never moves or changes the mask.

## Typical workflow

1. If your acquisition produced separate BMP files, use the [Converter](manual/converter.md) to order them and create a multiband TIFF.
2. Open the TIFF in the [Image viewer](manual/image-viewer.md) to inspect individual channels or compare a thumbnail grid.
3. Send it to the [Image annotator](manual/image-annotator.md), define semantic classes, and label regions.
4. Save and download a package containing `mask.tif` and `annotations.json`, optionally with the unchanged source image.

You may also start directly in the Viewer or Annotator with an existing `.tif` or `.tiff` file.

## Choose a starting point

- New users: read the [Converter](manual/converter.md), [Image viewer](manual/image-viewer.md), and [Image annotator](manual/image-annotator.md) guides.
- Administrators: follow [Docker deployment](deployment/docker.md), including the persistence and security notes.
- Integrators: use the [HTTP API](api.md) reference and the export format description.

## Scope of MulAn v1

MulAn reads ordinary raster TIFF datasets exposed by Rasterio. It does not interpret OME-TIFF or hyperstack semantics, reproject rasters, edit coordinate reference systems, run inference, manage datasets, merge masks, or perform instance segmentation. The annotator is designed primarily for desktop use.

## Project attribution

MulAn is part of the [TEXTaiLES](https://www.echoes-eccch.eu/textailes/) toolbox. The project documentation acknowledges [Athena Research Center](https://www.athenarc.gr/) and follows the visual structure of the TEXTaiLES documentation family.

<div class="project-logos">
  <a href="https://www.echoes-eccch.eu/textailes/" target="_blank" rel="noopener">
    <img src="assets/Logo-Textailes-Colour-RGB-Hor.png" alt="TEXTaiLES"/>
  </a>
  <a href="https://www.athenarc.gr/" target="_blank" rel="noopener">
    <img src="assets/athenarc-logo.png" alt="Athena Research Center"/>
  </a>
</div>

