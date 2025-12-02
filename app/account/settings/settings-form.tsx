"use client";

import { useActionState, useEffect, useState } from "react";
import { changePassword, addAddress, deleteAddress, setDefaultAddress } from "./actions";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { Label } from "../../../src/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../src/components/ui/card";
import { toast } from "sonner";
import { Address } from "@prisma/client";
import { Trash2, Check, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../src/components/ui/dialog";
import { Checkbox } from "../../../src/components/ui/checkbox";

interface SettingsFormProps {
  addresses: Address[];
  hasPassword: boolean;
}

export default function SettingsForm({ addresses, hasPassword }: SettingsFormProps) {
  const [passwordState, passwordAction] = useActionState(changePassword, undefined);
  const [addressState, addressAction] = useActionState(addAddress, undefined);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  useEffect(() => {
    if (passwordState?.message) {
      if (passwordState.success) {
        toast.success(passwordState.message);
      } else {
        toast.error(passwordState.message);
      }
    }
  }, [passwordState]);

  useEffect(() => {
    if (addressState?.message) {
      if (addressState.success) {
        toast.success(addressState.message);
        setIsAddressModalOpen(false);
      } else {
        toast.error(addressState.message);
      }
    }
  }, [addressState]);

  return (
    <div className="space-y-8">
      {/* Address Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shipping Addresses</CardTitle>
              <CardDescription>Manage your delivery addresses.</CardDescription>
            </div>
            <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Address</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Address</DialogTitle>
                  <DialogDescription>Enter your shipping details below.</DialogDescription>
                </DialogHeader>
                <form action={addressAction} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" name="country" placeholder="USA" required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="street">Address Line 1</Label>
                    <Input id="street" name="street" placeholder="123 Main St" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="street2">Address Line 2 (Optional)</Label>
                    <Input id="street2" name="street2" placeholder="Apt, Suite, Unit, etc." />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" placeholder="New York" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input id="state" name="state" placeholder="NY (Optional)" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP / Postal Code</Label>
                      <Input id="zip" name="zip" placeholder="10001" required />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isDefault" name="isDefault" />
                    <Label htmlFor="isDefault">Set as default address</Label>
                  </div>
                  {addressState?.errors && (
                    <div className="text-red-500 text-sm">
                      Please check the form for errors.
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="submit">Save Address</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No addresses saved yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map((addr) => (
                <div key={addr.id} className="relative rounded-lg border p-4 flex flex-col justify-between">
                  {addr.isDefault && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Default
                    </div>
                  )}
                  <div className="space-y-1 text-sm mb-4">
                    <p className="font-semibold">{addr.name}</p>
                    <p>{addr.street}</p>
                    {addr.street2 && <p>{addr.street2}</p>}
                    <p>
                      {addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.zip}
                    </p>
                    <p>{addr.country}</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    {!addr.isDefault && (
                      <Button variant="outline" size="sm" onClick={() => setDefaultAddress(addr.id)}>
                        Set Default
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteAddress(addr.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change Section (Only for credential users) */}
      {hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={passwordAction} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" required />
                {passwordState?.errors?.currentPassword && <p className="text-sm text-red-500">{passwordState.errors.currentPassword}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" required />
                {passwordState?.errors?.newPassword && <p className="text-sm text-red-500">{passwordState.errors.newPassword}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
                {passwordState?.errors?.confirmPassword && <p className="text-sm text-red-500">{passwordState.errors.confirmPassword}</p>}
              </div>
              <Button type="submit">Update Password</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
