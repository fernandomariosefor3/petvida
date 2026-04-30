import { useEffect } from 'react';

interface SeoJsonLdProps {
  id: string;
  schema: Record<string, unknown>;
}

export default function SeoJsonLd({ id, schema }: SeoJsonLdProps) {
  useEffect(() => {
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [id, schema]);

  return null;
}
