import { adaptive, comparatorDesc } from "./adaptive";
import apiUsage from "./adaptive/api/usage";

export const leastUsed = () => adaptive(comparatorDesc, apiUsage);
