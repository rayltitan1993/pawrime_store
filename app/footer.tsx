import Link from "next/link";

const footerLinks = [
	{
		title: "Shop",
		links: [
			{ name: "All Products", href: "/" },
		],
	},
	{
		title: "Support",
		links: [
			{ name: "Account", href: "/account" },
		],
	},
	{
		title: "Company",
		links: [
			// Placeholder links removed to fix 404 errors
		],
	},
];

export function Footer() {
	return (
		<footer className="border-t border-border bg-background">
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
					{footerLinks.map((column) => (
						<div key={column.title}>
							<h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
								{column.title}
							</h3>
							<ul className="mt-4 space-y-4">
								{column.links.map((link) => (
									<li key={link.name}>
										<Link
											href={link.href}
											className="text-base text-muted-foreground hover:text-foreground transition-colors"
										>
											{link.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				<div className="mt-12 border-t border-border pt-8">
					<p className="text-base text-muted-foreground text-center">
						&copy; {new Date().getFullYear()} Your Next Store. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}