import type { CategoryColumn } from "./category-column/types";
import type { NumberColumn } from "./number-column/types";
import type { TextColumn } from "./text-column/types";

export type AllColumns = NumberColumn | CategoryColumn | TextColumn;
