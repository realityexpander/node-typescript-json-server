// declare module "*";
declare module "hello-world" {
  export function HelloWorld(html: () => string, state: string): string;
}
