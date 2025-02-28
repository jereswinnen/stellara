import { Pokedex } from "pokeapi-js-wrapper";

// Initialize the Pokedex with caching
const P = new Pokedex({
  cache: true,
  timeout: 5000,
});

// Total number of Pokemon in the National Pokedex (as of Gen 9)
const TOTAL_POKEMON = 1025;

export interface PokemonData {
  id: number;
  name: string;
  sprite: string;
  flavorText: string;
  types: string[];
}

// Get a random Pokemon ID between 1 and TOTAL_POKEMON
export function getRandomPokemonId(): number {
  return Math.floor(Math.random() * TOTAL_POKEMON) + 1;
}

// Get Pokemon of the day - uses the current date as a seed
export function getPokemonOfTheDayId(): number {
  const today = new Date();
  const dateString = `${today.getFullYear()}-${
    today.getMonth() + 1
  }-${today.getDate()}`;

  // Create a simple hash from the date string
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash << 5) - hash + dateString.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Get a positive number and mod it with the total number of Pokemon
  const positiveHash = Math.abs(hash);
  return (positiveHash % TOTAL_POKEMON) + 1;
}

// Fetch Pokemon data by ID
export async function fetchPokemonData(id: number): Promise<PokemonData> {
  try {
    // Fetch basic Pokemon data
    const pokemon = await P.getPokemonByName(id);

    // Fetch species data for flavor text
    const species = await P.getPokemonSpeciesByName(id);

    // Find an English flavor text
    const englishFlavorText =
      species.flavor_text_entries.find(
        (entry: any) => entry.language.name === "en"
      )?.flavor_text || "No description available.";

    // Clean up flavor text (remove newlines and special characters)
    const cleanFlavorText = englishFlavorText
      .replace(/[\n\f]/g, " ")
      .replace(/\u000c/g, " ");

    return {
      id: pokemon.id,
      name: pokemon.name,
      sprite:
        pokemon.sprites.other["official-artwork"].front_default ||
        pokemon.sprites.front_default ||
        "",
      flavorText: cleanFlavorText,
      types: pokemon.types.map((type: any) => type.type.name),
    };
  } catch (error) {
    console.error("Error fetching Pokemon data:", error);
    throw error;
  }
}
