import { Box, Center } from "@mantine/core";
import type { RowData } from "@tanstack/react-table";
import type { TanstabilCellContext } from "./table-types";

const spriteMasks = [
  ["00111100", "01122110", "11233211", "12322321", "12333321", "01222210", "00122100", "00011000"],
  ["00033000", "00322300", "03222230", "32211223", "32233223", "03222230", "00322300", "00033000"],
  ["00111100", "01222210", "12233221", "12322321", "12222221", "01233210", "00122100", "00011000"],
  ["00022000", "00233200", "02311320", "23122132", "23233232", "02322320", "00211200", "00022000"],
] as const;

const spritePalettes = [
  ["#1f9d78", "#8ce99a", "#0b7285"],
  ["#d9480f", "#ffd43b", "#9c36b5"],
  ["#1971c2", "#74c0fc", "#364fc7"],
  ["#c2255c", "#faa2c1", "#f08c00"],
  ["#2f9e44", "#b2f2bb", "#5c940d"],
] as const;

function hashSeed(seed: string | number) {
  const value = String(seed);
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function DummySprite({
  label = "Dummy sprite",
  seed,
}: {
  label?: string;
  seed: string | number;
}) {
  const hash = hashSeed(seed);
  const mask = spriteMasks[hash % spriteMasks.length];
  const palette = spritePalettes[hash % spritePalettes.length];

  return (
    <Box
      aria-label={label}
      role="img"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        height: "100%",
        imageRendering: "pixelated",
        maxHeight: 48,
        maxWidth: 48,
        width: "100%",
      }}
    >
      {mask.flatMap((row, rowIndex) =>
        [...row].map((cell, columnIndex) => (
          <Box
            aria-hidden
            key={`${rowIndex}:${columnIndex}`}
            style={{
              aspectRatio: "1",
              background:
                cell === "1"
                  ? palette[0]
                  : cell === "2"
                    ? palette[1]
                    : cell === "3"
                      ? palette[2]
                      : "transparent",
            }}
          />
        )),
      )}
    </Box>
  );
}

export function SpriteCell<TData extends RowData>({ getValue, row }: TanstabilCellContext<TData>) {
  const seed = String(getValue() ?? row.id);

  return (
    <Center h="100%" p={4}>
      <DummySprite seed={seed} />
    </Center>
  );
}
