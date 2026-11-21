import { adaptive, comparatorDesc } from "./adaptive";
import apiBusiness from "./adaptive/api/business";

export const leastBusy = () => adaptive(comparatorDesc, apiBusiness);
