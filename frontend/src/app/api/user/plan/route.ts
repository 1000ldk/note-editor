import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action } = await req.json();

    if (action === 'complete_memo') {
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          points: { increment: 10 }
        }
      });
      
      // Update rank based on points
      let newRank = user.rank;
      if (user.points >= 100) newRank = "ゴールド";
      else if (user.points >= 50) newRank = "シルバー";
      
      if (newRank !== user.rank) {
        await prisma.user.update({
           where: { id: session.user.id },
           data: { rank: newRank }
        });
      }

      return NextResponse.json({ success: true, points: user.points, rank: newRank });
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error) {
    console.error("[USER_PLAN_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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

    return NextResponse.json({ 
      plan: user?.plan || "FREE",
      points: user?.points || 0,
      rank: user?.rank || "ブロンズ"
    });
  } catch (error) {
    console.error("[USER_PLAN_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
