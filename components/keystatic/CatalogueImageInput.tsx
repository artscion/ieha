'use client';

import { useId, useState, type ReactElement } from 'react';
import type { FormFieldInputProps } from '@keystatic/core';
import { publishImageSourceUrl } from '@/lib/keystatic/image-source-url-bridge';

type ImageValue = {
  data: Uint8Array;
  extension: string;
  filename: string;
} | null;

type BaseInputProps = FormFieldInputProps<ImageValue> & {
  label?: string;
  description?: string;
  validation?: { isRequired?: boolean };
};

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function slugFromPathname(pathname: string): string | undefined {
  const match = pathname.match(/\/item\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function CatalogueImageInput({
  BaseInput,
  ...props
}: BaseInputProps & {
  BaseInput: (props: BaseInputProps) => ReactElement | null;
}) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const errorId = useId();
  const statusId = useId();

  async function importFromUrl() {
    setStatus('loading');
    setMessage(null);
    try {
      const res = await fetch('/api/catalogue/import-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          url,
          slug:
            typeof window !== 'undefined'
              ? slugFromPathname(window.location.pathname)
              : undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        dataBase64?: string;
        extension?: string;
        filename?: string;
        sourceUrl?: string;
      };
      if (!res.ok || !data.dataBase64 || !data.extension || !data.filename) {
        setStatus('error');
        setMessage(data.error || 'Import failed.');
        return;
      }
      props.onChange({
        data: base64ToUint8Array(data.dataBase64),
        extension: data.extension,
        filename: data.filename,
      });
      publishImageSourceUrl(data.sourceUrl ?? url.trim());
      setStatus('success');
      setMessage('Image imported. Save the entry to store it in the repository.');
    } catch {
      setStatus('error');
      setMessage('Import failed.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <BaseInput
        {...props}
        onChange={(value) => {
          props.onChange(value);
          // Manual upload or remove replaces URL-import provenance.
          publishImageSourceUrl(null);
          setStatus('idle');
          setMessage(null);
        }}
      />

      <div
        role="group"
        aria-labelledby="catalogue-image-url-label"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid #E6E1D8',
        }}
      >
        <span id="catalogue-image-url-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          Import from URL
        </span>
        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.75 }}>
          Downloads the image through the server and attaches it as a local file (same as upload).
          The public site will use the repository copy, not the remote link.
        </p>
        <label htmlFor="catalogue-image-url-input" style={{ fontSize: '0.8rem' }}>
          Image URL
        </label>
        <input
          id="catalogue-image-url-input"
          type="url"
          inputMode="url"
          placeholder="https://example.org/images/artwork.jpg"
          value={url}
          disabled={status === 'loading'}
          aria-invalid={status === 'error'}
          aria-describedby={`${statusId}${status === 'error' ? ` ${errorId}` : ''}`}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            padding: '0.5rem 0.65rem',
            border: '1px solid #E6E1D8',
            borderRadius: 4,
            fontSize: '0.9rem',
          }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            disabled={status === 'loading' || !url.trim()}
            onClick={() => void importFromUrl()}
            style={{
              padding: '0.45rem 0.75rem',
              border: '1px solid #3F5643',
              background: status === 'loading' ? '#E6E1D8' : '#3F5643',
              color: '#FBFAF7',
              borderRadius: 4,
              fontSize: '0.85rem',
              cursor: status === 'loading' || !url.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'loading' ? 'Importing…' : 'Import image'}
          </button>
        </div>
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          style={{
            margin: 0,
            fontSize: '0.8rem',
            color: status === 'success' ? '#3F5643' : undefined,
          }}
        >
          {status === 'success'
            ? message
            : status === 'loading'
              ? 'Fetching and validating image…'
              : null}
        </p>
        {status === 'error' && message ? (
          <p id={errorId} role="alert" style={{ margin: 0, fontSize: '0.8rem', color: '#8B3A2F' }}>
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
