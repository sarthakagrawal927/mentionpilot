interface MDXContentProps {
  code: string;
}

export function MDXContent({ code }: MDXContentProps) {
  return <div dangerouslySetInnerHTML={{ __html: code }} />;
}
