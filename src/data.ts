import Papa from "papaparse";

const targetPokemonEntries = 1_000;

export interface Pokemon {
  id: string;
  pokedex_number: number;
  name: string;
  type1: string;
  type2: string;
  abilities: string[];
  hp: number;
  attack: number;
  defense: number;
  sp_attack: number;
  sp_defense: number;
  speed: number;
  base_total: number;
  height_m: number;
  weight_kg: number;
  generation: number;
  is_legendary: boolean;
  base_happiness: number;
  capture_rate: number;
  classfication: string;
}

function expandPokemonData(rows: Pokemon[]) {
  if (rows.length === 0) {
    return rows;
  }

  const copyCount = Math.ceil(targetPokemonEntries / rows.length);
  let i = 0;
  return Array.from({ length: copyCount }, (_, copyIndex) =>
    rows.map((row, ii) => ({
      ...row,
      index: i++,
      id: copyIndex === 0 ? row.id : `${row.id}:${copyIndex}`,
      abilities: [...row.abilities],
    })),
  )
    .flat()
    .slice(0, targetPokemonEntries);
}

async function loadPokemonData(): Promise<Pokemon[]> {
  try {
    const response = await fetch("/pokemon.csv");
    const csvText = await response.text();

    const result = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = result.data.map((row: Record<string, string>, index: number) => {
      // Parse abilities from string format like "['Overgrow', 'Chlorophyll']"
      let abilities: string[] = [];
      const abilitiesStr = row.abilities || "";
      if (abilitiesStr) {
        try {
          // Replace single quotes with double quotes and evaluate
          const cleaned = abilitiesStr.replace(/'/g, '"');
          abilities = JSON.parse(cleaned);
        } catch {
          // Fallback: try to extract from the string format
          abilities = abilitiesStr
            .replace(/[[\]']/g, "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }

      return {
        id: index.toString(),
        pokedex_number: parseInt(row.pokedex_number || "0"),
        name: row.name || "",
        type1: row.type1 || "",
        type2: row.type2 || "",
        abilities,
        hp: parseInt(row.hp || "0"),
        attack: parseInt(row.attack || "0"),
        defense: parseInt(row.defense || "0"),
        sp_attack: parseInt(row.sp_attack || "0"),
        sp_defense: parseInt(row.sp_defense || "0"),
        speed: parseInt(row.speed || "0"),
        base_total: parseInt(row.base_total || "0"),
        height_m: parseFloat(row.height_m || "0"),
        weight_kg: parseFloat(row.weight_kg || "0"),
        generation: parseInt(row.generation || "0"),
        is_legendary: row.is_legendary === "1",
        base_happiness: parseInt(row.base_happiness || "0"),
        capture_rate: parseInt(row.capture_rate || "0"),
        classfication: row.classfication || "",
      };
    });

    return expandPokemonData(rows);
  } catch (error) {
    console.error("Failed to load Pokemon data:", error);
    return [];
  }
}

export const pokemonPromise = loadPokemonData();
