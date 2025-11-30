import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "../../../src/components/ui/button";

export default function CheckoutSuccessPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
			<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
				<CheckCircle2 className="w-8 h-8 text-green-600" />
			</div>
			<h1 className="text-3xl font-bold tracking-tight mb-2">Order Confirmed!</h1>
			<p className="text-muted-foreground max-w-[600px] mb-8 text-lg">
				Thank you for your purchase. We've received your order and will begin processing it right away.
			</p>
			<Button asChild size="lg" className="rounded-full">
				<Link href="/">Continue Shopping</Link>
			</Button>
		</div>
	);
}
