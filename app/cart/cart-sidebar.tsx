"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "../../src/components/ui/button";
import { ScrollArea } from "../../src/components/ui/scroll-area";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "../../src/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../../src/components/ui/dialog";
import { formatMoney } from "../../src/money";
import { useCart } from "./cart-context";
import { CartItem } from "./cart-item";

const currency = "USD";
const locale = "en-US";

interface CartSidebarProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export function CartSidebar({ user }: CartSidebarProps) {
	const { isOpen, closeCart, items, itemCount, subtotal, cartId } = useCart();

	const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);

	const handleCheckout = async () => {
        setIsCheckoutDialogOpen(false); // Close dialog if open
		setIsCheckoutLoading(true);
		try {
			const response = await fetch("/api/checkout", {
				method: "POST",
			});
			const data = await response.json();
			if (!response.ok) {
				console.error("API Error Response:", data);
				throw new Error(data.error || "Checkout failed");
			}
			if (data.url) {
				window.location.href = data.url;
			}
		} catch (error: any) {
			console.error("Checkout error:", error);
			toast.error(error.message || "An error occurred during checkout");
			setIsCheckoutLoading(false);
		}
	};

    const onCheckoutClick = () => {
        if (user) {
            handleCheckout();
        } else {
            setIsCheckoutDialogOpen(true);
        }
    };

	return (
        <>
		<Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
			<SheetContent className="flex flex-col w-full sm:max-w-lg">
				<SheetHeader className="border-b border-border pb-4">
					<SheetTitle className="flex items-center gap-2">
						Your Cart
						{itemCount > 0 && (
							<span className="text-sm font-normal text-muted-foreground">({itemCount} items)</span>
						)}
					</SheetTitle>
				</SheetHeader>

				{items.length === 0 ? (
					<div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
							<ShoppingBag className="h-10 w-10 text-muted-foreground" />
						</div>
						<div className="text-center">
							<p className="text-lg font-medium">Your cart is empty</p>
							<p className="text-sm text-muted-foreground mt-1">Add some products to get started</p>
						</div>
						<Button variant="outline" onClick={closeCart}>
							Continue Shopping
						</Button>
					</div>
				) : (
					<>
						<ScrollArea className="flex-1 px-4">
							<div className="divide-y divide-border">
								{items.map((item) => (
									<CartItem key={item.productVariant.id} item={item} />
								))}
							</div>
						</ScrollArea>

						<SheetFooter className="border-t border-border pt-4 mt-auto">
							<div className="w-full space-y-4">
								<div className="flex items-center justify-between text-base">
									<span className="font-medium">Subtotal</span>
									<span className="font-semibold">{formatMoney({ amount: subtotal, currency, locale })}</span>
								</div>
								<p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout</p>
								<Button 
									className="w-full h-12 text-base font-medium" 
									onClick={onCheckoutClick}
									disabled={isCheckoutLoading}
								>
									{isCheckoutLoading ? "Redirecting..." : "Checkout"}
								</Button>
								<button
									type="button"
									onClick={closeCart}
									className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									Continue Shopping
								</button>
							</div>
						</SheetFooter>
					</>
				)}
			</SheetContent>
		</Sheet>

        <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>How would you like to checkout?</DialogTitle>
                    <DialogDescription>
                        Sign in to save your order history and speed up future purchases, or continue as a guest.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                     <Link href="/login?callbackUrl=/cart" onClick={() => { closeCart(); setIsCheckoutDialogOpen(false); }}>
                        <Button className="w-full" size="lg">Sign In & Checkout</Button>
                    </Link>
                    <div className="relative flex items-center justify-center text-xs uppercase text-muted-foreground">
                         <span className="bg-background px-2">Or</span>
                    </div>
                    <Button variant="outline" className="w-full" size="lg" onClick={handleCheckout} disabled={isCheckoutLoading}>
                         {isCheckoutLoading ? "Redirecting..." : "Checkout as Guest"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        </>
	);
}
