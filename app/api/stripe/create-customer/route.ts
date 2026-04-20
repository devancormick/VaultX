import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: { source: "vaultx_signup" },
    });

    // Update user profile with customer ID
    const supabase = createServiceRoleClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: customer.id })
      .eq("email", email);

    if (updateError) {
      console.error("Failed to update profile:", updateError);
      // Don't fail the request, customer is created
    }

    return NextResponse.json({ customerId: customer.id });
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}