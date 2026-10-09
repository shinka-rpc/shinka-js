import type { OutScope } from "@shinka-rpc/core";

const dummy = () => 0;
export default { add: dummy, remove: dummy } satisfies OutScope;
