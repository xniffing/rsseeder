import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

// Extend the default sanitization schema to allow KaTeX classes and elements
const sanitizeSchema = {
	...defaultSchema,
	tagNames: [
		...(defaultSchema.tagNames ?? []),
		'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'ms', 'mtext',
		'msup', 'msub', 'msubsup', 'mfrac', 'mroot', 'msqrt', 'mtable',
		'mtr', 'mtd', 'mover', 'munder', 'munderover', 'mspace',
		'annotation', 'span'
	],
	attributes: {
		...defaultSchema.attributes,
		'*': [...(defaultSchema.attributes?.['*'] ?? []), 'className', 'style'],
		img: [...(defaultSchema.attributes?.['img'] ?? []), 'src', 'alt', 'loading', 'referrerpolicy'],
		a: [...(defaultSchema.attributes?.['a'] ?? []), 'href', 'target', 'rel'],
		math: ['xmlns'],
		annotation: ['encoding']
	}
};

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
		.use(rehypeSanitize, sanitizeSchema)
		.use(rehypeStringify);

	return String(processor.processSync(markdown));
}
