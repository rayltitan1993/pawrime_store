"use server";

import { auth } from "../../../auth";
import { prisma } from "../../../src/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const AddressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().optional(),
});

export async function changePassword(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { message: "Not authenticated" };

  const validatedFields = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed",
    };
  }

  const { currentPassword, newPassword } = validatedFields.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.password) {
    return { message: "User not found or using social login" };
  }

  const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordsMatch) {
    return { message: "Incorrect current password" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  return { message: "Password updated successfully", success: true };
}

export async function addAddress(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { message: "Not authenticated" };

  const validatedFields = AddressSchema.safeParse({
    name: formData.get("name"),
    street: formData.get("street"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    country: formData.get("country"),
    isDefault: formData.get("isDefault") === "on",
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed",
    };
  }

  const data = validatedFields.data;

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  await prisma.address.create({
    data: {
      userId: session.user.id,
      ...data,
    },
  });

  revalidatePath("/account/settings");
  return { message: "Address added successfully", success: true };
}

export async function deleteAddress(addressId: string) {
  const session = await auth();
  if (!session?.user?.id) return { message: "Not authenticated" };

  await prisma.address.delete({
    where: {
      id: addressId,
      userId: session.user.id, // Ensure user owns address
    },
  });

  revalidatePath("/account/settings");
}

export async function setDefaultAddress(addressId: string) {
  const session = await auth();
  if (!session?.user?.id) return { message: "Not authenticated" };

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId, userId: session.user.id },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/account/settings");
}
