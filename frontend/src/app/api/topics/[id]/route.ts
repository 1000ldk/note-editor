import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { title, positionX, positionY, parentId } = body;

    const topic = await prisma.topic.update({
      where: {
        id: id,
        userId: session.user.id,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(positionX !== undefined && { positionX }),
        ...(positionY !== undefined && { positionY }),
        ...(parentId !== undefined && { parentId: parentId === "null" ? null : parentId }), // Un-parenting support
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("[TOPIC_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    const topic = await prisma.topic.delete({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("[TOPIC_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
