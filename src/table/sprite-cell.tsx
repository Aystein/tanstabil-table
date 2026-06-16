import type { CellContext, RowData } from "@tanstack/react-table";
import { Center, Image } from "@mantine/core";
import type { VantageFeatures } from "./use-vantage-table";
import type { Pokemon } from "@/data";

export function SpriteCell<TData extends RowData>({ row }: CellContext<VantageFeatures, TData>) {
  const original = row.original as Pokemon;
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${original.pokedex_number}.png`;

  return (
    <Center h="100%">
      <Image fit="contain" h="100%" src={spriteUrl} w="auto" />
    </Center>
  );
}
