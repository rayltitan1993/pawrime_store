import { prisma } from "./lib/prisma";

export interface Product {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  images: string[];
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  price: string;
  images: string[];
  product: Product;
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalAmount: string;
  lineItems: CartLine[];
}

export interface CartLine {
  id: string;
  quantity: number;
  productVariant: ProductVariant;
}

export class MockYnsProvider {
  // In-memory product store (kept as is for product catalog)
  private products: Product[] = [
    {
      id: "prod_1",
      slug: "basic-tee",
      name: "Basic Tee",
      summary: "A simple, high-quality cotton t-shirt.",
      description: "The Basic Tee is an essential wardrobe staple...",
      images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800"],
      variants: [
        { id: "var_1", name: "Black / S", price: "2000", images: [], product: {} as any },
        { id: "var_2", name: "Black / M", price: "2000", images: [], product: {} as any },
        { id: "var_3", name: "Black / L", price: "2000", images: [], product: {} as any },
        { id: "var_4", name: "White / S", price: "2000", images: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800"], product: {} as any },
        { id: "var_5", name: "White / M", price: "2000", images: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800"], product: {} as any },
      ],
    },
    {
      id: "prod_2",
      slug: "ceramic-mug",
      name: "Ceramic Mug",
      summary: "A handcrafted ceramic mug for your morning coffee.",
      description: "Enjoy your favorite hot beverage...",
      images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800"],
      variants: [
        { id: "var_6", name: "Standard", price: "1500", images: [], product: {} as any },
      ],
    },
    {
      id: "prod_3",
      slug: "leather-wallet",
      name: "Leather Wallet",
      summary: "A sleek and durable leather wallet.",
      description: "Keep your cards and cash organized...",
      images: ["https://images.unsplash.com/photo-1627123424574-1837526ae418?auto=format&fit=crop&q=80&w=800"],
      variants: [
        { id: "var_7", name: "Brown", price: "4500", images: [], product: {} as any },
        { id: "var_8", name: "Black", price: "4500", images: [], product: {} as any },
      ],
    },
  ];

  constructor() {
    // Fix circular references for static products
    this.products.forEach(p => p.variants.forEach(v => v.product = p));
  }

  async productsList(): Promise<Product[]> {
    return this.products;
  }

  async productGet({ slug }: { slug: string }): Promise<Product | undefined> {
    return this.products.find((p) => p.slug === slug);
  }

  // REFACTORED: Persistent Cart via Prisma
  async cartGet({ cartId }: { cartId: string }): Promise<Cart | undefined> {
    if (!cartId) return undefined;
    
    const dbCart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { lines: true },
    });

    if (!dbCart) return undefined;

    // Map DB lines back to Domain CartLines
    const lineItems: CartLine[] = dbCart.lines.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      productVariant: {
        id: line.variantId,
        name: line.variantName,
        price: line.price,
        images: line.productImage ? [line.productImage] : [],
        product: {
          id: line.productId,
          slug: line.productSlug,
          name: line.productName,
          summary: "", // Not stored in line
          description: "", // Not stored in line
          images: [line.productImage], // Main image
          variants: [], // Not needed for cart display usually
        },
      },
    }));

    // Calculate total
    const totalCents = lineItems.reduce((sum, item) => {
      return sum + parseInt(item.productVariant.price) * item.quantity;
    }, 0);

    return {
      id: dbCart.id,
      checkoutUrl: "/checkout", // Internal route
      totalAmount: totalCents.toString(),
      lineItems,
    };
  }

  async cartUpsert({
    cartId,
    lines,
  }: {
    cartId?: string;
    lines: { productVariantId: string; quantity: number }[];
  }): Promise<Cart> {
    // 1. Re-fetch full product details for these variants to store snapshots
    const lineData = lines.map((line) => {
        let variant: ProductVariant | undefined;
        let product: Product | undefined;
        
        for (const p of this.products) {
            const v = p.variants.find(v => v.id === line.productVariantId);
            if (v) {
                variant = v;
                product = p;
                break;
            }
        }

        if (!variant || !product) {
            throw new Error(`Variant ${line.productVariantId} not found`);
        }

        return {
            productId: product.id,
            productSlug: product.slug,
            productName: product.name,
            productImage: variant.images[0] || product.images[0] || "",
            variantId: variant.id,
            variantName: variant.name,
            price: variant.price,
            quantity: line.quantity
        };
    });

    // 2. Upsert Cart in DB
    let dbCart;

    if (cartId) {
        // Try to update existing cart
        try {
            dbCart = await prisma.cart.update({
                where: { id: cartId },
                data: {
                    lines: {
                        deleteMany: {}, // Clear old lines
                        create: lineData, // Add new lines
                    },
                },
                include: { lines: true },
            });
        } catch (e) {
            // If cart not found (e.g. invalid cookie), create new
             dbCart = await prisma.cart.create({
                data: {
                    lines: {
                        create: lineData,
                    },
                },
                include: { lines: true },
            });
        }
    } else {
        // Create new cart
        dbCart = await prisma.cart.create({
            data: {
                lines: {
                    create: lineData,
                },
            },
            include: { lines: true },
        });
    }

    // 3. Convert back to Domain Object
    const lineItems: CartLine[] = dbCart.lines.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      productVariant: {
        id: line.variantId,
        name: line.variantName,
        price: line.price,
        images: line.productImage ? [line.productImage] : [],
        product: {
          id: line.productId,
          slug: line.productSlug,
          name: line.productName,
          summary: "",
          description: "",
          images: [line.productImage],
          variants: [],
        },
      },
    }));

     const totalCents = lineItems.reduce((sum, item) => {
      return sum + parseInt(item.productVariant.price) * item.quantity;
    }, 0);

    return {
      id: dbCart.id,
      checkoutUrl: "/checkout",
      totalAmount: totalCents.toString(),
      lineItems,
    };
  }
}

export const ynsClient = new MockYnsProvider();
