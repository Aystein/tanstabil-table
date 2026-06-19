import { pokemonPromise, type Pokemon } from "../data";
import { Badge, Box, Center, Group, Stack, Text } from "@mantine/core";
import { columns } from "./table-columns";
import { DummySprite } from "./sprite-cell";
import { TableGrid } from "./table-grid";
import { useTableAiTools } from "./use-table-ai-tools";
import { useVantageTable, vantageFeatures } from "./hook/use-vantage-table";
import { useRef, useEffect, useState } from "react";
import type { TableVirtualizer } from "./table-types";
import type { GridCellProps } from "./table-grid-cell";

function PokemonGridCell({ row }: GridCellProps<Pokemon>) {
  const pokemon = row.original;
  const stats = [
    ["HP", pokemon.hp],
    ["ATK", pokemon.attack],
    ["DEF", pokemon.defense],
    ["SPD", pokemon.speed],
  ] as const;

  return (
    <Group h="100%" gap="xs" miw={0} p="xs" style={{ overflow: "hidden" }} wrap="nowrap">
      <Center
        bg="color-mix(in oklab, var(--color-muted) 50%, transparent)"
        h="100%"
        style={{ aspectRatio: "1", borderRadius: "var(--radius-md)", flexShrink: 0 }}
      >
        <Box h="70%" w="70%">
          <DummySprite label={`${pokemon.name} dummy sprite`} seed={pokemon.pokedex_number} />
        </Box>
      </Center>

      <Stack gap="xs" justify="space-between" miw={0} style={{ flex: "1 1 0" }}>
        <Box miw={0}>
          <Text fw={600} size="xs" truncate>
            {pokemon.name}
          </Text>
          <Group gap={4} mt={4} miw={0}>
            {[pokemon.type1, pokemon.type2].filter(Boolean).map((type, index) => (
              <Badge
                c="dimmed"
                color="gray"
                key={`${index}:${type}`}
                maw="100%"
                size="xs"
                variant="outline"
              >
                {type}
              </Badge>
            ))}
          </Group>
        </Box>

        <Group gap={4}>
          {stats.map(([label, value]) => (
            <Badge c="var(--color-foreground)" color="gray" key={label} size="xs" variant="outline">
              <Text c="dimmed" component="span" inherit>
                {label}
              </Text>{" "}
              {value}
            </Badge>
          ))}
        </Group>
      </Stack>
    </Group>
  );
}

export function usePokemonTable() {
  const [data, setData] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const rowVirtualizerRef = useRef<TableVirtualizer>(undefined);

  const instance = useVantageTable<Pokemon>({
    data,
    columns,
    gridCardHeight: 120,
    gridCardSizing: "fixed",
    gridCardWidth: 250,
    gridCell: PokemonGridCell,
    rowVirtualizerRef: rowVirtualizerRef as any,
    renderFallbackValue: "—",
    features: vantageFeatures,
    columnResizeMode: "onEnd",
    enableExpanding: false,
    getRowCanExpand: () => true,
    initialState: {
      columnOrder: ["expand", "select", "testbool"],
      rowHeight: 36,
      clusters: {
        clusterGroupsById: {
          Hiho: {
            id: "Hiho",
            clustersById: {
              cluster1: {
                id: "Cluster 1",
                rowIds: ["1", "2", "3", "4"],
              },
              cluster2: {
                id: "Cluster 2",
                rowIds: ["1", "2", "3", "4"],
              },
            },
          },
        },
      },
    },
  });

  useTableAiTools(instance as any);

  useEffect(() => {
    void pokemonPromise.then((pokemonData) => {
      setData(pokemonData);
      setIsLoading(false);
    });
  }, []);

  return {
    data,
    instance,
    isLoading,
  };
}

export function VantageTable({
  instance,
  isLoading,
}: {
  instance: ReturnType<typeof usePokemonTable>["instance"];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Center h="100%">Loading Pokémon data...</Center>;
  }

  return (
    <instance.Subscribe selector={(state) => state}>
      {() => <TableGrid instance={instance as any} />}
    </instance.Subscribe>
  );
}
