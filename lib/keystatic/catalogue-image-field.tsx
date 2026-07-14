import { fields } from '@keystatic/core';
import { CatalogueImageInput } from '@/components/keystatic/CatalogueImageInput';
import { ImageSourceUrlInput } from '@/components/keystatic/ImageSourceUrlInput';

type ImageFieldOptions = {
  label: string;
  description?: string;
  directory: string;
  publicPath: string;
};

/**
 * Standard Keystatic image field with an added "Import from URL" control.
 * Imported bytes flow through the same AssetFormField serialize path as uploads,
 * so GitHub storage commits them like any other image.
 */
export function catalogueImageField(options: ImageFieldOptions) {
  const base = fields.image(options);
  return {
    ...base,
    Input(props: Parameters<typeof base.Input>[0]) {
      return <CatalogueImageInput {...props} BaseInput={base.Input} />;
    },
  };
}

export function catalogueImageSourceUrlField() {
  const base = fields.url({
    label: 'Image source URL',
    description:
      'Optional provenance for a URL-imported image. Not used as the public image source. Cleared when you upload a file or remove the image.',
  });
  return {
    ...base,
    Input(props: Parameters<typeof base.Input>[0]) {
      return <ImageSourceUrlInput {...props} BaseInput={base.Input} />;
    },
  };
}
