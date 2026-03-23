import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

type HastNode = {
	type?: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: HastNode[];
};

function resolveUrl(value: unknown, baseUrl?: string) {
	if (typeof value !== 'string' || !value || !baseUrl) return value;
	if (value.startsWith('#')) return value;

	try {
		return new URL(value, baseUrl).toString();
	} catch {
		return value;
	}
}

function rebaseLinks(baseUrl?: string) {
	return (tree: HastNode) => {
		const visit = (node: HastNode) => {
			if (node.type === 'element' && node.properties) {
				if (node.tagName === 'a') {
					node.properties.href = resolveUrl(node.properties.href, baseUrl);
				}

				if (node.tagName === 'img') {
					node.properties.src = resolveUrl(node.properties.src, baseUrl);
					node.properties.loading = 'lazy';
				}
			}

			for (const child of node.children ?? []) {
				visit(child);
			}
		};

		visit(tree);
	};
}

export function markdownToHtml(markdown: string, baseUrl?: string): string {
	const processor = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkMath)
		.use(remarkRehype)
		.use(rehypeKatex)
		.use(rebaseLinks, baseUrl)
		.use(rehypeStringify);

	return String(processor.processSync(markdown));
}
