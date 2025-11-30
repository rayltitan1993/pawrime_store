import { auth } from "../../auth";
import { prisma } from "../../src/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "../../src/money";
import { Package, Calendar, ArrowLeft } from "lucide-react";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-medium">No orders yet</h2>
          <p className="text-muted-foreground mt-2 mb-6">
            You haven't placed any orders yet. Start shopping to see them here!
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2 bg-foreground text-background rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div key={order.id} className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="bg-secondary/30 px-6 py-4 flex flex-wrap gap-4 items-center justify-between border-b border-border">
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="block text-muted-foreground">Order Date</span>
                    <span className="font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Order ID</span>
                    <span className="font-mono">{order.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Total Amount</span>
                    <span className="font-medium">
                      {formatMoney({
                        amount: BigInt(order.amountTotal),
                        currency: order.currency,
                        locale: "en-US",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                    </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right font-medium text-sm">
                        {formatMoney({
                          amount: BigInt(item.price),
                          currency: order.currency,
                          locale: "en-US",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
