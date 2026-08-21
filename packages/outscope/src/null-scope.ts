import type { OutScope } from "./types";

const dummy = () => 0;
export default { add: dummy, remove: dummy } satisfies OutScope;
