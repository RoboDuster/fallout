/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    "systems/fallout-dusty/templates/actor/parts/actor-header.html",
    "systems/fallout-dusty/templates/actor/parts/actor-attributes.html",
    "systems/fallout-dusty/templates/actor/parts/actor-skills.html",
    "systems/fallout-dusty/templates/actor/parts/actor-perks.html",
    "systems/fallout-dusty/templates/actor/parts/actor-apparel.html",
    "systems/fallout-dusty/templates/actor/parts/actor-weapons.html",
    "systems/fallout-dusty/templates/actor/parts/actor-status.html",
    "systems/fallout-dusty/templates/actor/parts/actor-encumbrance.html",
    "systems/fallout-dusty/templates/actor/parts/actor-effects.html",
    "systems/fallout-dusty/templates/actor/parts/actor-equipped_apparel.html",
    "systems/fallout-dusty/templates/actor/parts/actor-favorite_weapons.html",
    "systems/fallout-dusty/templates/actor/parts/actor-conditions.html",
    "systems/fallout-dusty/templates/actor/parts/actor-inventory.html",
    "systems/fallout-dusty/templates/actor/parts/actor-special_abilities.html",
    "systems/fallout-dusty/templates/actor/parts/body-status-plaque.html",
    "systems/fallout-dusty/templates/item/parts/item-header.html",
    "systems/fallout-dusty/templates/item/parts/item-effects.html",
    "systems/fallout-dusty/templates/actor/parts/simple-expandable-item.html"
  ]);
};
