import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-none
      [&_h1]:text-text-primary [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-6 [&_h1]:mb-3
      [&_h2]:text-text-primary [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2
      [&_h3]:text-text-primary [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
      [&_p]:text-text-secondary [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3
      [&_ul]:text-text-secondary [&_ul]:text-sm [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5
      [&_ol]:text-text-secondary [&_ol]:text-sm [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5
      [&_li]:mb-1
      [&_code]:bg-bg-surface-hover [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent [&_code]:text-xs [&_code]:font-mono
      [&_pre]:bg-bg-primary [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:overflow-x-auto
      [&_pre_code]:bg-transparent [&_pre_code]:p-0
      [&_strong]:text-text-primary [&_strong]:font-semibold
      [&_a]:text-accent [&_a]:hover:text-accent-hover [&_a]:no-underline
      [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-secondary
      [&_table]:w-full [&_table]:text-sm
      [&_th]:text-left [&_th]:text-text-secondary [&_th]:font-medium [&_th]:pb-2 [&_th]:border-b [&_th]:border-border
      [&_td]:py-1.5 [&_td]:text-text-secondary [&_td]:border-b [&_td]:border-border/50
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
