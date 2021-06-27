/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    "systems/fallout/templates/actor/parts/actor-header.html",
    "systems/fallout/templates/actor/parts/actor-skills.html",
    "systems/fallout/templates/actor/parts/actor-perks.html",
    "systems/fallout/templates/actor/parts/actor-apparel.html",
    "systems/fallout/templates/actor/parts/actor-weapons.html",
    "systems/fallout/templates/actor/parts/actor-status.html",
    "systems/fallout/templates/actor/parts/actor-effects.html",
    "systems/fallout/templates/actor/parts/body-status-plaque.html",
    "systems/fallout/templates/item/parts/item-header.html"
  ]);
};
