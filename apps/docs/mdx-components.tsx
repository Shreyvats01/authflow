import React from 'react';
type MDXComponents = Record<string, React.ComponentType<any>>;
import defaultComponents from 'fumadocs-ui/mdx';
import { DlxTabs, InstallTabs } from './src/components/package-manager-tabs';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    img: (props: any) => {
      if (!props.width || !props.height) {
        return <img {...props} />;
      }
      const DefaultImg = defaultComponents.img || 'img';
      return <DefaultImg {...props} />;
    },
    InstallTabs,
    DlxTabs,
    ...components,
  };
}
