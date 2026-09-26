/// <reference lib="ES2021">

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
