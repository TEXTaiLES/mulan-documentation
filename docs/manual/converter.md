# Converter

The Converter combines separate BMP captures into one multiband TIFF. It preserves input pixel values and uses the order you choose as the TIFF band order.

## Prepare the files

Every input must:

- have a `.bmp` extension and be a valid BMP file;
- have exactly the same width and height as the other inputs; and
- decode to a compatible integer datatype.

A grayscale BMP contributes one output channel. An RGB BMP contributes three adjacent channels in fixed **R, G, B** order. RGB files may be mixed with grayscale files, but their three channels always stay together. Colour-paletted BMPs are not supported; use a true RGB BMP instead.

!!! tip
    Use filenames or notes from the acquisition session to establish spectral order before converting. MulAn cannot infer physical wavelengths from pixel values.

## Create a TIFF

1. Open **Convert** in the top navigation.
2. Drop one or more BMP files into the upload area, or use the file picker.
3. Arrange file rows from lower to higher wavelength. Drag a row by its handle or use its up and down buttons.
4. Optionally enter a name for each output channel.
5. Review the output-channel count, then select **Convert to TIF**.
6. On the result page, select **Download TIF** or **Open in Viewer**.

The wavelength guide is an ordering aid, not an automatic validator. If your data follows another convention, arrange it according to the convention required by your downstream workflow.

## Channel names

Names are written as TIFF band descriptions and appear in the Viewer. For a grayscale file, enter one name such as `550nm`. For an RGB file, you may enter a separate name for each of its R, G, and B channels.

MulAn pre-fills a grayscale wavelength when an evident value from 100 to 2500 nm appears in forms such as:

- `700.bmp`;
- `700nm.bmp`; or
- `wavelength_700.bmp`.

Always check an inferred name against the acquisition metadata. Empty grayscale names remain unnamed. Empty RGB names receive defaults based on the filename, for example `scene:R`, `scene:G`, and `scene:B`.

## What conversion preserves

- BMP sample values are copied without an RGB-to-grayscale conversion.
- File order becomes band-group order.
- Each RGB group stays in R, G, B order.
- The output has the same width, height, and integer datatype as its compatible inputs.

The converter does not add a coordinate reference system or affine transform. If georeferencing is required, apply it with an appropriate GIS workflow after conversion.

## Troubleshooting

| Message or symptom | Cause and action |
| --- | --- |
| “is not a BMP file” | Select a file ending in `.bmp`. Renaming another format is not enough. |
| Files have different dimensions | Export or crop all source channels to the same pixel dimensions, then retry. |
| Files have incompatible datatypes | Re-export the channels using the same integer bit depth. |
| Colour-paletted BMP is rejected | Export it as a true RGB BMP. A genuinely grayscale palette is accepted. |
| RGB output adds three channels | This is expected. RGB is stored as three adjacent TIFF bands. |
| A wavelength name is wrong | Edit the name before converting; filename inference is only a convenience. |

Converted results are temporary server resources. Download the TIFF you want to keep.

