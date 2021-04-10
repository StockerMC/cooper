import SkillsHelper from "../skillsHelper";
import COOP from "../../../../../origin/coop";

export default class CraftingHelper {

    static CRAFTABLES = {
        PICK_AXE: {
            levelReq: 1,
            xpReward: 1,
            ingredients: {
                WOOD: 5,
                IRON_BAR: 2
            }
        },
        FRYING_PAN: {
            levelReq: 5,
            xpReward: 2,
            ingredients: {
                STEEL_BAR: 2,
                IRON_BAR: 1
            }
        },
        AXE: {
            levelReq: 1,
            xpReward: 1,
            ingredients: {
                WOOD: 10,
                IRON_BAR: 1
            }
        },
        SHIELD: {
            levelReq: 20,
            xpReward: 3,
            ingredients: {
                GOLD_BAR: 2,
                STEEL_BAR: 3,
                IRON_BAR: 5
            }
        },
    }

    static isItemCraftable(code) {
        return typeof this.CRAFTABLES[code] !== 'undefined';
    }

    // Check whether it is possible for someone to craft an item x qty.
    static async canFulfilIngredients(memberID, itemCode, qty) {
        let craftable = false;

        const ingredients = this.CRAFTABLES[itemCode].ingredients;
        const ingredList = Object.keys(this.CRAFTABLES[itemCode].ingredients);
        const ownedIngredients = await Promise.all(
            ingredList.map(ingred => COOP.ITEMS.getUserItem(memberID, ingred)
        ));

        // Check ingredients are sufficient.
        const sufficiencyChecks = ownedIngredients.map(ingred => {
            // Filter out unowned items.
            if (!ingred) return false;

            console.log(ingred);

            // Check sufficiency
            const req = ingredients[ingred.item_code] * qty;
            const owned = ingred.quantity;

            // Declare insufficient.
            if (owned < req) return false;
            else return true;
        });

        // Check all ingredients sufficient.
        if (sufficiencyChecks.every(sufficient => sufficient)) 
            craftable = true;

        // TODO: Improve.
        // Otherwise pull out the ones that aren't, into an error message:

        // Return a more helpful result.
        // const manifest = { sufficient: false, checks: sufficiencyChecks };
        // return manifest;

        return craftable;
    }

    
    static async craft(memberID, itemCode, qty) {
        try {
            // Access the required ingredients for crafting operation.
            const product = this.CRAFTABLES[itemCode];
            const ingredients = this.CRAFTABLES[itemCode].ingredients;
            const ingredList = Object.keys(this.CRAFTABLES[itemCode].ingredients);

            // Subtract all of the ingredients.
            await Promise.all(
                // TODO: Optimise into one database call.
                ingredList.map(ingred => COOP.ITEMS.subtract(memberID, ingred, ingredients[ingred] * qty)
            ));

            // Add the resultant item.
            await COOP.ITEMS.add(memberID, itemCode, qty);

            // Calculate experience
            SkillsHelper.addXP(memberID, 'crafting', product.xpReward * qty);

            // Indicate succesful craft.
            return true;

        } catch(e) {
            console.log('Error occurred crafting');
            console.error(e);
            return false;
        }
    }

}