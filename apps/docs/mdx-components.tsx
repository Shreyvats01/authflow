import React from 'react';
type MDXComponents = Record<string, React.ComponentType<any>>;
import defaultComponents from 'fumadocs-ui/mdx';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ...components,
  };
}
