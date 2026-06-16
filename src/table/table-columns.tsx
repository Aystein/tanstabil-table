import { type ColumnDef } from "@tanstack/react-table";
import { createTextColumnDef } from "./text-column/utils";
import type { VantageFeatures } from "./use-vantage-table";
import type { Pokemon } from "@/data";
import { createNumberColumn } from "./number-column/util";
import { SpriteCell } from "./sprite-cell";
import { createCategoricalArrayColumn } from "./categorical-array-column/util";
import { createBooleanColumnDef } from "./boolean-column";
import { createDateColumnDef } from "./date-column";
import { createCategoryColumnDef } from "./category-column/utils";

export const columns: ColumnDef<VantageFeatures, Pokemon, any>[] = [
  {
    id: "sprite",
    accessorFn: (row) => row.pokedex_number,
    header: "Sprite",
    cell: SpriteCell,
    enableGrouping: false,
    size: 80,
  },
  createTextColumnDef({
    id: "id",
    accessorFn: (_, index) => index,
    header: "ID",
    enableGrouping: true,
    size: 100,
  }),
  createBooleanColumnDef({
    id: "testbool",
    accessorFn: (row) => row.is_legendary,
    header: "Legendary",
    enableGrouping: true,
    size: 110,
  }),
  createDateColumnDef({
    id: "date",
    accessorFn: (row) => new Date(new Date().setDate(Math.round(Math.random() * 25) + 1)),
    header: "Date",
  }),
  createTextColumnDef({
    id: "name",
    accessorFn: (row) => row.name,
    header: "Name",
    enableGrouping: true,
    size: 150,
  }),
  createCategoricalArrayColumn({
    id: "abilities",
    accessorFn: (row) => row.abilities,
    header: "Abilities",
    enableGrouping: false,
    size: 200,
  }),
  createNumberColumn({
    id: "hp",
    accessorFn: (row) => row.hp,
    header: "HP",
    enableGrouping: false,
    size: 100,
  }),
  createNumberColumn({
    id: "attack",
    accessorFn: (row) => row.attack,
    header: "Attack",
    enableGrouping: false,
    size: 100,
  }),
  createNumberColumn({
    id: "defense",
    accessorFn: (row) => row.defense,
    header: "Defense",
    enableGrouping: false,
    size: 100,
  }),
  createNumberColumn({
    id: "sp_attack",
    accessorFn: (row) => row.sp_attack,
    header: "Sp. Attack",
    enableGrouping: false,
    size: 120,
  }),
  createNumberColumn({
    id: "sp_defense",
    accessorFn: (row) => row.sp_defense,
    header: "Sp. Defense",
    enableGrouping: false,
    size: 130,
  }),
  createNumberColumn({
    id: "speed",
    accessorFn: (row) => row.speed,
    header: "Speed",
    enableGrouping: false,
    size: 100,
  }),
  createNumberColumn({
    id: "base_total",
    accessorFn: (row) => row.base_total,
    header: "Base Total",
    enableGrouping: false,
    size: 110,
  }),
  createCategoryColumnDef({
    id: "type1",
    accessorFn: (row) => row.type1,
    header: "Type 1",
    enableGrouping: true,
    size: 100,
  }),
  createCategoryColumnDef({
    id: "type2",
    accessorFn: (row) => row.type2 || "—",
    header: "Type 2",
    enableGrouping: true,
    size: 100,
  }),
  createCategoryColumnDef({
    id: "generation",
    accessorFn: (row) => row.generation,
    header: "Generation",
    enableGrouping: true,
    size: 110,
    overrideCategories: (categories) => {
      return categories.map((category) => ({
        ...category,
        label: `Generation ${category.value}`,
      }));
    },
  }),
  createTextColumnDef({
    id: "is_legendary",
    accessorFn: (row) => (row.is_legendary ? "Legendary" : "Regular"),
    header: "Rarity",
    enableGrouping: true,
    size: 110,
  }),
];
