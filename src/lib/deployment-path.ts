export const deploymentBasePath =
  process.env.NEXT_PUBLIC_BASE_PATH === "/staging" ? "/staging" : "";

export const authApiBasePath = `${deploymentBasePath}/api/auth`;

export function withDeploymentBasePath(pathname: string): string {
  return `${deploymentBasePath}${pathname}`;
}
