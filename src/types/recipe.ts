// Recipe data types
export interface RecipeComponent {
  code: string | null;
  name: string;
  dryMatter: number; // Base dry matter from recipe (%)
  actualDryMatter: number | null; // Actual input dry matter (user can override)
  baseQuantity: number; // kg per 1000kg base (FIXED base)
  isFlexible: boolean; // Whether this ingredient can be adjusted (e.g., water)
}

export interface Recipe {
  code: string;
  name: string;
  components: RecipeComponent[];
  totalBase: number; // Total base weight (should be ~1000kg)
}

// Stock/leftover data
export interface StockItem {
  code: string;
  name: string;
  quantity: number; // kg available
  actualDryMatter: number | null; // Actual dry matter of stock
}

// Calculation result
export interface CalculationResult {
  component: RecipeComponent;
  baseQuantity: number; // Base quantity from recipe (fixed reference)
  requiredQuantity: number; // Final calculated quantity
  dryMatterContribution: number; // kg of dry matter contribution
  fromStock: number; // kg to take from stock
  stockShortage: number; // kg shortage if any
  isAdjusted: boolean; // Whether this ingredient was adjusted
  isFlexible: boolean; // Whether this is the flexible compensator
  originalActualDryMatter: number | null; // Original actual DM if changed
}

// Parse the raw Excel data into structured format
export function parseRecipeData(rawData: any[][]): Recipe[] {
  const recipes: Map<string, Recipe> = new Map();
  let currentCode = '';
  let currentName = '';

  for (let i = 1; i < rawData.length; i++) { // Skip header row
    const row = rawData[i];
    const code = row[0];
    const name = row[1];
    const componentCode = row[2];
    const componentName = row[3];
    const dryMatter = parseFloat(row[4]) || 0;
    const baseQuantity = parseFloat(row[5]) || 0;

    if (code && (typeof code === 'number' || (typeof code === 'string' && code.trim()))) {
      currentCode = String(code).trim();
      currentName = name || '';

      if (!recipes.has(currentCode)) {
        recipes.set(currentCode, {
          code: currentCode,
          name: currentName,
          components: [],
          totalBase: 0
        });
      }
    }

    if (currentCode && componentName) {
      const recipe = recipes.get(currentCode)!;
      // Default: water (0% DM) or lowest DM ingredient is the flexible one
      const isWater = dryMatter === 0 || componentName.toLowerCase().includes('вод');
      recipe.components.push({
        code: componentCode ? String(componentCode) : null,
        name: componentName,
        dryMatter,
        actualDryMatter: null,
        baseQuantity,
        isFlexible: isWater
      });
      recipe.totalBase += baseQuantity;
    }
  }

  return Array.from(recipes.values());
}

/**
 * Calculate required quantities for a given blending volume
 *
 * LOGIC:
 * - Total blend weight = targetVolume (FIXED - does not change)
 * - If one ingredient's actual dry matter differs from base:
 *   1. Calculate its new weight to maintain dry matter contribution
 *   2. The flexible ingredient (typically water) adjusts to keep total weight constant
 *   3. Other ingredients remain at base proportion (scaled)
 *
 * Formula for changed ingredient:
 *   newWeight = baseWeight × baseDryMatter / actualDryMatter
 *
 * Then compensate with flexible ingredient:
 *   flexibleWeight = targetVolume - sum(other ingredients' weights)
 */
export function calculateForVolume(recipe: Recipe, targetVolume: number): CalculationResult[] {
  const scaleFactor = targetVolume / 1000;

  // Find which ingredient(s) have actual dry matter different from base
  const changedIngredients: number[] = [];
  const effectiveDryMatters: number[] = [];

  recipe.components.forEach((comp, idx) => {
    effectiveDryMatters.push(comp.actualDryMatter ?? comp.dryMatter);
    if (comp.actualDryMatter !== null && comp.actualDryMatter !== comp.dryMatter) {
      changedIngredients.push(idx);
    }
  });

  // If no changes, just scale normally
  if (changedIngredients.length === 0) {
    return recipe.components.map(component => {
      const scaledQty = component.baseQuantity * scaleFactor;
      const dryMatterContrib = (scaledQty * component.dryMatter) / 100;

      return {
        component,
        baseQuantity: Math.round(scaledQty * 100) / 100,
        requiredQuantity: Math.round(scaledQty * 100) / 100,
        dryMatterContribution: Math.round(dryMatterContrib * 100) / 100,
        fromStock: 0,
        stockShortage: 0,
        isAdjusted: false,
        isFlexible: component.isFlexible,
        originalActualDryMatter: null
      };
    });
  }

  // Calculate weights for all non-flexible ingredients
  const results: CalculationResult[] = [];
  const nonFlexibleIndices: number[] = [];
  const flexibleIndex = recipe.components.findIndex(c => c.isFlexible);

  // Calculate scaled base quantities for all ingredients
  const scaledBaseQtys = recipe.components.map(c => c.baseQuantity * scaleFactor);

  // Calculate dry matter contributions and required quantities
  let changedWeightTotal = 0; // Total weight change due to DM changes
  let originalDryMatterContrib = 0; // Original total dry matter contribution

  // First pass: calculate changed ingredient weights
  recipe.components.forEach((comp, idx) => {
    const effectiveDM = effectiveDryMatters[idx];

    if (effectiveDM !== comp.dryMatter) {
      // This ingredient needs weight adjustment
      const originalScaledQty = scaledBaseQtys[idx];
      const originalDryMatter = (originalScaledQty * comp.dryMatter) / 100;
      originalDryMatterContrib += originalDryMatter;

      // New weight = original dry matter contribution / new DM percentage
      const newWeight = (originalDryMatter * 100) / effectiveDM;
      changedWeightTotal += (newWeight - originalScaledQty);
    }
  });

  // Second pass: calculate all ingredients
  let flexibleWeight = 0;
  const finalQtys: number[] = [];

  recipe.components.forEach((comp, idx) => {
    const effectiveDM = effectiveDryMatters[idx];
    const originalScaledQty = scaledBaseQtys[idx];
    const originalDryMatter = (originalScaledQty * comp.dryMatter) / 100;

    if (idx === flexibleIndex) {
      // Flexible ingredient compensates for all changes
      // Target total = targetVolume, so flexible = target - sum(other ingredients)
      let sumOthers = 0;
      recipe.components.forEach((c, i) => {
        if (i !== idx) {
          const dm = effectiveDryMatters[i];
          const origQty = scaledBaseQtys[i];
          const origDM = (origQty * c.dryMatter) / 100;
          if (dm !== c.dryMatter) {
            sumOthers += (origDM * 100) / dm;
          } else {
            sumOthers += origQty;
          }
        }
      });
      flexibleWeight = targetVolume - sumOthers;
      finalQtys.push(Math.max(0, flexibleWeight));
    } else if (effectiveDM !== comp.dryMatter) {
      // Changed ingredient - recalculate weight
      const newWeight = (originalDryMatter * 100) / effectiveDM;
      finalQtys.push(newWeight);
    } else {
      // Unchanged ingredient - keep scaled base
      finalQtys.push(originalScaledQty);
    }
  });

  // Build results
  return recipe.components.map((comp, idx) => {
    const requiredQty = finalQtys[idx];
    const effectiveDM = effectiveDryMatters[idx];
    const dryMatterContrib = (requiredQty * effectiveDM) / 100;

    return {
      component: comp,
      baseQuantity: Math.round(scaledBaseQtys[idx] * 100) / 100,
      requiredQuantity: Math.round(requiredQty * 100) / 100,
      dryMatterContribution: Math.round(dryMatterContrib * 100) / 100,
      fromStock: 0,
      stockShortage: 0,
      isAdjusted: idx === flexibleIndex || (comp.actualDryMatter !== null && comp.actualDryMatter !== comp.dryMatter),
      isFlexible: idx === flexibleIndex,
      originalActualDryMatter: comp.actualDryMatter
    };
  });
}

/**
 * Calculate blending based on available stock (leftovers in kg)
 *
 * LOGIC:
 * 1. For each component in recipe, check if we have stock data
 * 2. Use stock quantity as available amount
 * 3. Calculate the MAXIMUM blend volume that can be made with available stock
 *    (limited by whichever component runs out first)
 * 4. Proportionally scale other components to match available quantities
 * 5. If stock actual dry matter is available, use it; otherwise use recipe base DM
 */
export function calculateByStock(
  recipe: Recipe,
  stock: StockItem[]
): { results: CalculationResult[]; maxPossibleVolume: number; calculatedVolume: number } {
  // Create stock map for quick lookup
  const stockMap = new Map<string, StockItem>();
  stock.forEach(item => {
    if (item.code) {
      stockMap.set(String(item.code), item);
    }
  });

  // Step 1: For each component, determine if we have stock
  // If we have stock, we can make as much as stock allows
  // If no stock, we'll calculate proportionally from other available quantities

  const componentsWithStock = recipe.components.map((comp, idx) => {
    const stockItem = stockMap.get(comp.code || '');
    return {
      idx,
      comp,
      stockQty: stockItem?.quantity || 0,
      actualDM: stockItem?.actualDryMatter ?? null,
      hasStock: (stockItem?.quantity || 0) > 0
    };
  });

  // Step 2: Calculate how much volume we can make if we use ALL stock proportionally
  // For each component: volume = available_qty / (base_qty_per_1000kg * 1000)
  // The limiting factor (lowest volume) determines max production

  // But we also need to account for dry matter - higher DM = less water needed
  // So we need to iterate and calculate the actual blend that results

  // Simpler approach:
  // 1. Find the ratio of actual stock to base recipe for each component
  // 2. The minimum ratio determines max volume (limiting reagent)
  // 3. Calculate final quantities based on this max volume

  let minRatio = Infinity;
  let totalStockWeight = 0;

  for (const { comp, stockQty, hasStock } of componentsWithStock) {
    if (hasStock && comp.baseQuantity > 0) {
      // How much volume can this stock make?
      // baseRecipe: 1000kg total = comp.baseQuantity of this ingredient
      // So per 1kg of this ingredient, we can make: 1000 / comp.baseQuantity kg of blend
      const ratio = stockQty / comp.baseQuantity;
      if (ratio < minRatio) {
        minRatio = ratio;
      }
      totalStockWeight += stockQty;
    }
  }

  // If no stock, can't make anything
  if (minRatio === Infinity) {
    return {
      results: recipe.components.map(comp => ({
        component: comp,
        baseQuantity: comp.baseQuantity,
        requiredQuantity: 0,
        dryMatterContribution: 0,
        fromStock: 0,
        stockShortage: 0,
        isAdjusted: false,
        isFlexible: comp.isFlexible,
        originalActualDryMatter: null
      })),
      maxPossibleVolume: 0,
      calculatedVolume: 0
    };
  }

  // This is the maximum volume we can produce (in thousands of kg base)
  // So actual volume in kg = minRatio * 1000
  const calculatedVolume = Math.floor(minRatio * 1000);

  // Step 3: Calculate how much of each component we need for this volume
  const scaleFactor = calculatedVolume / 1000;

  const results: CalculationResult[] = recipe.components.map((comp, idx) => {
    const stockItem = stockMap.get(comp.code || '');
    const availableStock = stockItem?.quantity || 0;
    const effectiveDM = stockItem?.actualDryMatter ?? comp.dryMatter;

    // Calculate required quantity for the calculated volume
    const requiredQty = comp.baseQuantity * scaleFactor;

    // Determine if this component was adjusted (stock used vs calculated)
    const shortage = Math.max(0, requiredQty - availableStock);

    // Calculate dry matter contribution based on actual DM used
    const dryMatterContrib = (Math.min(requiredQty, availableStock) * effectiveDM) / 100;

    return {
      component: comp,
      baseQuantity: Math.round(comp.baseQuantity * scaleFactor * 100) / 100,
      requiredQuantity: Math.round(requiredQty * 100) / 100,
      dryMatterContribution: Math.round(dryMatterContrib * 100) / 100,
      fromStock: Math.min(requiredQty, availableStock),
      stockShortage: Math.round(shortage * 100) / 100,
      isAdjusted: availableStock > 0 && availableStock !== requiredQty,
      isFlexible: comp.isFlexible,
      originalActualDryMatter: stockItem?.actualDryMatter ?? null
    };
  });

  // Update maxPossibleVolume to reflect what we can actually produce
  const maxPossibleVolume = calculatedVolume;

  return { results, maxPossibleVolume, calculatedVolume };
}

// Get unique component codes for stock lookup
export function getComponentCodes(recipes: Recipe[]): Set<string> {
  const codes = new Set<string>();
  recipes.forEach(recipe => {
    recipe.components.forEach(comp => {
      if (comp.code) {
        codes.add(comp.code);
      }
    });
  });
  return codes;
}

// Search recipes by code or name
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const q = query.toLowerCase().trim();
  if (!q) return recipes;

  return recipes.filter(r =>
    r.code.toLowerCase().includes(q) ||
    r.name.toLowerCase().includes(q)
  );
}

/**
 * Calculate blend when user directly changes a component's quantity
 *
 * LOGIC:
 * 1. User changes quantity of ingredient X to a specific value
 * 2. Calculate the "effective volume" based on this change:
 *    effectiveVolume = changedQuantity / (baseQuantity / 1000)
 * 3. ALL ingredients scale proportionally to maintain the
 *    original dry matter contribution ratio
 * 4. Total weight STAYS THE SAME as targetVolume - this is FIXED
 * 5. The final blend maintains the target weight exactly
 *
 * Result: The dry matter percentage stays the same, but all ingredients
 * (including water) scale proportionally. Total weight never changes.
 *
 * @param recipe - The recipe
 * @param changedComponentName - Name of the changed component
 * @param newQuantity - New quantity for the changed component
 * @param targetVolume - Target total blend weight (MUST be preserved)
 */
export function calculateOnComponentChange(
  recipe: Recipe,
  changedComponentName: string,
  newQuantity: number,
  targetVolume: number
): CalculationResult[] {
  // Find the changed component
  const changedIdx = recipe.components.findIndex(c => c.name === changedComponentName);
  if (changedIdx === -1) {
    return calculateForVolume(recipe, targetVolume);
  }

  const changedComponent = recipe.components[changedIdx];

  // Calculate what "effective volume" this change represents
  // If base recipe has baseQuantity of this component, and we're changing to newQuantity
  // Then: effectiveVolume = newQuantity / (baseQuantity / 1000)
  const baseRatio = changedComponent.baseQuantity / 1000;
  const effectiveVolume = baseRatio > 0 ? newQuantity / baseRatio : 1000;

  // Scale factor based on the change
  const scaleFactor = effectiveVolume / 1000;

  // CRITICAL: Total weight is ALWAYS targetVolume - never changes
  const target = targetVolume;

  // Calculate dry matter adjusted weights for ALL ingredients
  const effectiveDryMatters = recipe.components.map(c => c.actualDryMatter ?? c.dryMatter);

  // First pass: calculate weights for all ingredients proportionally
  const tempQtys: number[] = [];
  recipe.components.forEach((comp, idx) => {
    const effectiveDM = effectiveDryMatters[idx];
    const scaledQty = comp.baseQuantity * scaleFactor;

    if (effectiveDM !== comp.dryMatter) {
      // Dry matter changed - adjust weight to maintain dry matter contribution
      const origDM = (scaledQty * comp.dryMatter) / 100;
      const newWeight = (origDM * 100) / effectiveDM;
      tempQtys.push(newWeight);
    } else {
      tempQtys.push(scaledQty);
    }
  });

  // Calculate what total we got with proportional scaling
  const tempTotal = tempQtys.reduce((sum, qty) => sum + qty, 0);

  // If total doesn't match target, scale ALL ingredients proportionally
  // This keeps the ratios the same but adjusts to exact target weight
  let finalQtys: number[];
  if (Math.abs(tempTotal - target) > 0.001) {
    const scaleToTarget = target / tempTotal;
    finalQtys = tempQtys.map(qty => qty * scaleToTarget);
  } else {
    finalQtys = [...tempQtys];
  }

  // Find water component for marking
  const waterIdx = recipe.components.findIndex(c => c.dryMatter === 0 || c.name.toLowerCase().includes('вод'));

  // Build results
  return recipe.components.map((comp, idx) => {
    const requiredQty = finalQtys[idx];
    const effectiveDM = effectiveDryMatters[idx];
    const dryMatterContrib = (requiredQty * effectiveDM) / 100;

    return {
      component: comp,
      baseQuantity: Math.round(comp.baseQuantity * scaleFactor * 100) / 100,
      requiredQuantity: Math.round(requiredQty * 100) / 100,
      dryMatterContribution: Math.round(dryMatterContrib * 100) / 100,
      fromStock: 0,
      stockShortage: 0,
      isAdjusted: comp.actualDryMatter !== null && comp.actualDryMatter !== comp.dryMatter,
      isFlexible: idx === waterIdx,
      originalActualDryMatter: comp.actualDryMatter
    };
  });
}