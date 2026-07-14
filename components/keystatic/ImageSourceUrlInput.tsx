'use client';

import { useEffect, type ReactElement } from 'react';
import type { FormFieldInputProps } from '@keystatic/core';
import { IMAGE_SOURCE_URL_EVENT } from '@/lib/keystatic/image-source-url-bridge';

type BaseInputProps = FormFieldInputProps<string | null> & {
  label?: string;
  description?: string;
  validation?: { isRequired?: boolean };
};

export function ImageSourceUrlInput({
  BaseInput,
  ...props
}: BaseInputProps & {
  BaseInput: (props: BaseInputProps) => ReactElement | null;
}) {
  const { onChange } = props;

  useEffect(() => {
    function onEvent(event: Event) {
      const detail = (event as CustomEvent<{ url: string | null }>).detail;
      onChange(detail?.url ?? null);
    }
    window.addEventListener(IMAGE_SOURCE_URL_EVENT, onEvent);
    return () => window.removeEventListener(IMAGE_SOURCE_URL_EVENT, onEvent);
  }, [onChange]);

  return <BaseInput {...props} />;
}
