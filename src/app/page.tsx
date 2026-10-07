import { listTargetRoles } from "@/lib/targetRole";
import HomeClient from "./HomeClient";

export default async function Home() {
  const roles = await listTargetRoles();
  return <HomeClient roles={roles} />;
}
