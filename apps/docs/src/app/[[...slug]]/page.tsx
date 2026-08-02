import { source } from '@/lib/source';
import { DocsPage, DocsBody } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { useMDXComponents } from '../../../mdx-components';

export const dynamicParams = false;

export default async function Page({ params }: { params: { slug?: string[] } }) {
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.exports.default;
  const components = useMDXComponents(defaultMdxComponents);

  return (
    <DocsPage toc={page.data.exports.toc} full={page.data.full}>
      <DocsBody>
        <MDX components={components} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  const pages = source.getPages();
  const params = pages.map((page) => ({
    slug: page.slugs,
  }));

  if (!params.some((p) => Array.isArray(p.slug) && p.slug.length === 0)) {
    params.push({ slug: [] });
  }

  return params;
}

export async function generateMetadata({ params }: { params: { slug?: string[] } }) {
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
