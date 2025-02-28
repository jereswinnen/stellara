"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RefreshCw } from "lucide-react";
import {
  fetchPokemonData,
  getPokemonOfTheDayId,
  getRandomPokemonId,
  type PokemonData,
} from "@/lib/pokemon";

export function PokemonOfTheDay() {
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPokemon = async (useRandomId = false) => {
    try {
      setIsLoading(true);
      setError(null);
      setIsRefreshing(useRandomId);

      // Get Pokemon ID - either today's Pokemon or a random one
      const pokemonId = useRandomId
        ? getRandomPokemonId()
        : getPokemonOfTheDayId();

      // Fetch the Pokemon data
      const data = await fetchPokemonData(pokemonId);
      setPokemon(data);
    } catch (err) {
      console.error("Failed to load Pokemon:", err);
      setError("Failed to load Pokémon. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPokemon();
  }, []);

  // Function to capitalize the first letter of a string
  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Determine if we should show the refresh button
  const showRefreshButton = !isLoading || isRefreshing;

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">
          Pokémon of the Day
        </CardTitle>
        {showRefreshButton && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadPokemon(true)}
            disabled={isLoading && !isRefreshing}
            className="cursor-pointer transition-all duration-200"
            title="Get random Pokémon"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        )}
      </CardHeader>
      <CardContent className="relative">
        {/* Loading State */}
        {isLoading && !isRefreshing && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-32 h-32 bg-muted rounded-full animate-pulse" />
            <Progress value={80} className="w-2/3" />
            <p className="text-sm text-muted-foreground">Loading Pokémon...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => loadPokemon()}>Try Again</Button>
          </div>
        )}

        {/* No Pokemon Data */}
        {!isLoading && !error && !pokemon && (
          <div className="flex flex-col items-center justify-center">
            <p className="text-muted-foreground">No Pokémon found.</p>
          </div>
        )}

        {/* Pokemon Data */}
        {!isLoading && !error && pokemon && (
          <div className="flex flex-col items-center space-y-4">
            {/* Pokemon Image */}
            <div className="relative w-32 h-32">
              {pokemon.sprite && (
                <Image
                  src={pokemon.sprite}
                  alt={pokemon.name}
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              )}
            </div>

            {/* Pokemon Info */}
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold">{capitalize(pokemon.name)}</h3>
              <p className="text-sm text-muted-foreground">
                #{pokemon.id.toString().padStart(3, "0")}
              </p>
            </div>

            {/* Pokemon Types */}
            <div className="flex space-x-2 justify-center">
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  className={`px-3 py-1 rounded-full text-xs font-medium text-white pokemon-type-${type}`}
                >
                  {capitalize(type)}
                </span>
              ))}
            </div>

            <Separator />

            {/* Pokemon Description */}
            <p className="text-sm text-center">{pokemon.flavorText}</p>
          </div>
        )}

        {/* Refreshing Overlay */}
        {isRefreshing && pokemon && (
          <div className="absolute inset-0 top-0 left-0 right-0 bottom-0 bg-background/50 flex items-center justify-center rounded-b-lg z-10">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Finding a new Pokémon...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
