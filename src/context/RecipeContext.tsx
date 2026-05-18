import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Recipe, StockItem, CalculationResult, parseRecipeData, calculateForVolume, calculateByStock, calculateOnComponentChange } from '../types/recipe';
import rawRecipeData from '../data/recipes.json';

interface RecipeContextType {
  recipes: Recipe[];
  selectedRecipe: Recipe | null;
  stock: StockItem[];
  targetVolume: number;
  calculationResults: CalculationResult[];
  maxPossibleVolume: number;
  calculatedVolume: number;
  viewMode: 'volume' | 'stock';
  setSelectedRecipe: (recipe: Recipe | null) => void;
  setTargetVolume: (volume: number) => void;
  setViewMode: (mode: 'volume' | 'stock') => void;
  updateComponentQuantity: (componentName: string, newQuantity: number) => void;
  updateComponentDryMatter: (componentName: string, newDryMatter: number) => void;
  setStock: (stock: StockItem[]) => void;
  updateStockItem: (code: string, quantity: number, actualDryMatter?: number | null) => void;
  calculate: () => void;
  searchRecipes: (query: string) => Recipe[];
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(() => parseRecipeData(rawRecipeData));
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [targetVolume, setTargetVolume] = useState(100);
  const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);
  const [maxPossibleVolume, setMaxPossibleVolume] = useState(0);
  const [calculatedVolume, setCalculatedVolume] = useState(0);
  const [viewMode, setViewMode] = useState<'volume' | 'stock'>('volume');

  const calculate = useCallback(() => {
    if (!selectedRecipe) return;

    if (viewMode === 'volume') {
      const results = calculateForVolume(selectedRecipe, targetVolume);
      setCalculationResults(results);
      setMaxPossibleVolume(targetVolume);
      setCalculatedVolume(targetVolume);
    } else {
      const { results, maxPossibleVolume: maxVol, calculatedVolume: calcVol } = calculateByStock(selectedRecipe, stock);
      setCalculationResults(results);
      setMaxPossibleVolume(maxVol);
      setCalculatedVolume(calcVol);
    }
  }, [selectedRecipe, targetVolume, stock, viewMode]);

  const updateComponentQuantity = useCallback((componentName: string, newQuantity: number) => {
    if (!selectedRecipe) return;

    setSelectedRecipe(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        components: prev.components.map(c =>
          c.name === componentName ? { ...c, baseQuantity: newQuantity } : c
        ),
        totalBase: prev.components.reduce((sum, c) =>
          sum + (c.name === componentName ? newQuantity : c.baseQuantity), 0
        )
      };
    });

    // Recalculate using the component change logic
    // This will proportionally adjust all other ingredients
    if (calculationResults.length > 0) {
      const results = calculateOnComponentChange(selectedRecipe, componentName, newQuantity, targetVolume);
      setCalculationResults(results);
      setCalculatedVolume(targetVolume);
    }
  }, [selectedRecipe, calculationResults, targetVolume]);

  const updateComponentDryMatter = useCallback((componentName: string, newDryMatter: number) => {
    if (!selectedRecipe) return;

    setSelectedRecipe(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        components: prev.components.map(c =>
          c.name === componentName ? { ...c, actualDryMatter: newDryMatter } : c
        )
      };
    });

    // Recalculate immediately if results exist
    if (calculationResults.length > 0) {
      setTimeout(() => calculate(), 0);
    }
  }, [selectedRecipe, calculationResults, calculate]);

  const updateStockItem = useCallback((code: string, quantity: number, actualDryMatter?: number | null) => {
    setStock(prev => {
      const existing = prev.find(s => s.code === code);
      if (existing) {
        return prev.map(s => s.code === code ? {
          ...s,
          quantity,
          ...(actualDryMatter !== undefined ? { actualDryMatter } : {})
        } : s);
      } else {
        return [...prev, {
          code,
          name: code,
          quantity,
          actualDryMatter: actualDryMatter ?? null
        }];
      }
    });
  }, []);

  const searchRecipes = useCallback((query: string): Recipe[] => {
    const q = query.toLowerCase().trim();
    if (!q) return recipes;

    return recipes.filter(r =>
      r.code.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q)
    );
  }, [recipes]);

  return (
    <RecipeContext.Provider value={{
      recipes,
      selectedRecipe,
      stock,
      targetVolume,
      calculationResults,
      maxPossibleVolume,
      calculatedVolume,
      viewMode,
      setSelectedRecipe,
      setTargetVolume,
      setViewMode,
      updateComponentQuantity,
      updateComponentDryMatter,
      setStock,
      updateStockItem,
      calculate,
      searchRecipes
    }}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
}