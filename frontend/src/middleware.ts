export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/memos/:path*", "/topics/:path*", "/canvas/:path*"],
};
