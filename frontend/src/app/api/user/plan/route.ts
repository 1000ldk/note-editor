import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { plan } = await req.json();

    if (plan !== "FREE" && plan !== "PREMIUM") {
      return new NextResponse("Invalid Plan", { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { plan },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_PLAN_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    return NextResponse.json({ plan: user?.plan || "FREE" });
  } catch (error) {
    console.error("[USER_PLAN_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
