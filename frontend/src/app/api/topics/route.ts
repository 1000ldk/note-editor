import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const topics = await prisma.topic.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error("[TOPICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, positionX, positionY, parentId, categoryName, color } = body;

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    const topic = await prisma.topic.create({
      data: {
        title,
        userId: session.user.id,
        positionX: positionX || 0,
        positionY: positionY || 0,
        parentId: parentId || null,
        categoryName: categoryName || null,
        color: color || null,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("[TOPICS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
