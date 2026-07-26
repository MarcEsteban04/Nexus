import { Fragment, ReactNode } from 'react';

function renderInline(text: string, keyPrefix: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== '');
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-surface-100">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>
    ),
  );
}

export function renderMarkdownLite(text: string): ReactNode {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];

  function flushList(key: string) {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="list-disc space-y-0.5 pl-4">
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-li-${i}`)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (bulletMatch) {
      listBuffer.push(bulletMatch[1]);
      return;
    }
    flushList(`list-${idx}`);

    if (/^###\s+/.test(trimmed)) {
      blocks.push(
        <p key={idx} className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-surface-400 first:mt-0">
          {renderInline(trimmed.replace(/^###\s+/, ''), `h3-${idx}`)}
        </p>,
      );
    } else if (/^##\s+/.test(trimmed)) {
      blocks.push(
        <p key={idx} className="mt-2.5 text-[14px] font-semibold text-surface-100 first:mt-0">
          {renderInline(trimmed.replace(/^##\s+/, ''), `h2-${idx}`)}
        </p>,
      );
    } else if (/^#\s+/.test(trimmed)) {
      blocks.push(
        <p key={idx} className="mt-2.5 text-[15px] font-semibold text-surface-100 first:mt-0">
          {renderInline(trimmed.replace(/^#\s+/, ''), `h1-${idx}`)}
        </p>,
      );
    } else if (trimmed === '') {
      blocks.push(<div key={idx} className="h-1.5" />);
    } else {
      blocks.push(<p key={idx}>{renderInline(line, `p-${idx}`)}</p>);
    }
  });
  flushList('list-end');

  return <div className="space-y-0.5">{blocks}</div>;
}
