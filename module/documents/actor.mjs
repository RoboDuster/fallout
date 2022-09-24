/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class FalloutActor extends Actor {
  /** @override */
  prepareData() {
    super.prepareData()
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this
    const actorSystem = actorData.system
    const flags = actorData.flags.fallout || {}
	
    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData)
    this._prepareRobotData(actorData)
    this._prepareNpcData(actorData)
  }

  /**
   * Prepare Character type specific data
   */

  // CHARACTER
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return
    const actorSystem = actorData.system
    this._calculateCharacterBodyResistance(actorData)
    actorSystem.favoriteWeapons = actorData.items.filter(
      (i) => i.type == 'weapon' && i.system.favorite,
    )
    // Encumbrance
    actorSystem.carryWeight.base =
      150 + parseInt(actorSystem.attributes.str.value) * 10
    actorSystem.carryWeight.value =
      parseInt(actorSystem.carryWeight.base) + parseInt(actorSystem.carryWeight.mod)
    actorSystem.totalWeight = this._getItemsTotalWeight()
    actorSystem.encumbranceLevel = 0
    if (actorSystem.totalWeight > actorSystem.carryWeight.value) {
      let dif = actorSystem.totalWeight - actorSystem.carryWeight.value
      actorSystem.encumbranceLevel = Math.ceil(dif / 50)
    }
	
	//XP totals
	actorSystem.level.nextLevelXP = (actorSystem.level.value*(actorSystem.level.value+1)/2)*100;
  }

  _calculateCharacterBodyResistance(actorData) {
    const actorSystem = actorData.system
    //  ! CHECK for the OUTFIT
    // Prep Body Locations
    let outfitedLocations = {}
    for (let [k, v] of Object.entries(
      game.system.model.Actor.character.body_parts,
    )) {
      outfitedLocations[k] = false
    }

    // ! CHECK POWER ARMOR PIECES
    let hasPowerArmor = false
    for (let [k, v] of Object.entries(outfitedLocations)) {
      if (!v) {
        let pow = actorData.items.find(
          (i) =>
            i.type == 'apparel' &&
            i.system.appareltype == 'powerArmor' &&
            i.system.equipped &&
            i.system.powered &&
            i.system.location[k] == true,
        )
        if (pow && !outfitedLocations[k]) {
          outfitedLocations[k] = duplicate(pow.toObject())
          hasPowerArmor = false
        }
      }
    }

    // ! CHECK ARMOR PIECES
    let hasArmor = false
    for (let [k, v] of Object.entries(outfitedLocations)) {
      if (!v) {
        let armor = actorData.items.find(
          (i) =>
            i.type == 'apparel' &&
            i.system.appareltype == 'armor' &&
            i.system.equipped &&
            i.system.location[k] == true,
        )
        if (armor && !outfitedLocations[k]) {
          outfitedLocations[k] = duplicate(armor.toObject())
          hasArmor = true
        }
      }
    }

    // ! CHECK OUTFIT
    if (
      !outfitedLocations['torso'] &&
      !outfitedLocations['armR'] &&
      !outfitedLocations['armL'] &&
      !outfitedLocations['legL'] &&
      !outfitedLocations['legR']
    ) {
      let outfit = actorData.items.find(
        (i) =>
          i.type == 'apparel' &&
          i.system.appareltype == 'outfit' &&
          i.system.equipped,
      )
      if (outfit) {
        for (let [k, v] of Object.entries(outfit.system.location)) {
          if (v) {
            outfitedLocations[k] = duplicate(outfit.toObject())
          }
        }
      }
    }

    // ! CHECK HEADGEAR
    if (!outfitedLocations['head']) {
      let headgear = actorData.items.find(
        (i) =>
          i.type == 'apparel' &&
          i.system.appareltype == 'headgear' &&
          i.system.equipped,
      )
      if (headgear) {
        outfitedLocations['head'] = duplicate(headgear.toObject())
      }
    }

    // ! ADD CLOTHING VALUES
    let clothing = actorData.items.find(
      (i) =>
        i.type == 'apparel' &&
        i.system.appareltype == 'clothing' &&
        i.system.equipped,
    )
    if (clothing) {
      for (let [k, v] of Object.entries(clothing.system.location)) {
        if (outfitedLocations[k] && v) {
          outfitedLocations[k].name += ` over ${clothing.name}`
          outfitedLocations[k].system.resistance.physical = Math.max(
            parseInt(outfitedLocations[k].system.resistance.physical),
            parseInt(clothing.system.resistance.physical),
          )
          outfitedLocations[k].system.resistance.energy = Math.max(
            parseInt(outfitedLocations[k].system.resistance.energy),
            parseInt(clothing.system.resistance.energy),
          )
          outfitedLocations[k].system.resistance.radiation = Math.max(
            parseInt(outfitedLocations[k].system.resistance.radiation),
            parseInt(clothing.system.resistance.radiation),
          )
        } else if (!outfitedLocations[k] && v) {
          outfitedLocations[k] = duplicate(clothing.toObject())
        }
      }
    }

    // ! SET BODY PARTS TO OUTFIT ADD CHARACTER BONUSES
    for (let [k, bodyPart] of Object.entries(actorData.system.body_parts)) {
      if (outfitedLocations[k]) {
        bodyPart.resistance.physical =
          parseInt(outfitedLocations[k].system.resistance.physical) +
          parseInt(actorData.system.resistance.physical)
        bodyPart.resistance.energy =
          parseInt(outfitedLocations[k].system.resistance.energy) +
          parseInt(actorData.system.resistance.energy)
        bodyPart.resistance.radiation =
          parseInt(outfitedLocations[k].system.resistance.radiation) +
          parseInt(actorData.system.resistance.radiation)
      } else {
        bodyPart.resistance.physical = parseInt(actorData.system.resistance.physical)
        bodyPart.resistance.energy = parseInt(actorData.system.resistance.energy)
        bodyPart.resistance.radiation = parseInt(actorData.system.resistance.radiation)
      }
    }
    // ADD OUTFITED LIST FOR DISPLAY
    actorData.system.outfitedLocations = outfitedLocations
  }

  // ROBOT
  _prepareRobotData(actorData) {
    if (actorData.type !== 'robot') return
    const actorSystem = actorData.system
    this._calculateRobotBodyResistance(actorData)
    actorSystem.favoriteWeapons = actorData.items.filter(
      (i) => i.type == 'weapon' && i.system.favorite,
    )
    actorData.system.equippedRobotMods = actorData.items
      .filter((i) => i.type == 'robot_mod' && i.system.equipped)
      .slice(0, 3)
    actorSystem.carryWeight.base = 150
    let robotArmors = this.items.filter((i) => {
      return i.type == 'robot_armor'
    })
    for (let i of robotArmors) {
      actorSystem.carryWeight.base += parseInt(i.system.carry)
    }
    actorSystem.carryWeight.value =
      parseInt(actorSystem.carryWeight.base) + parseInt(actorSystem.carryWeight.mod)
    actorSystem.totalWeight = this._getItemsTotalWeight()
    actorSystem.encumbranceLevel = 0
    if (actorSystem.totalWeight > actorSystem.carryWeight.value) {
      let dif = actorSystem.totalWeight - actorSystem.carryWeight.value
      actorSystem.encumbranceLevel = Math.ceil(dif / 50)
    }
  }

  _calculateRobotBodyResistance(actorData) {
    const actorSystem = actorData.system
    let outfitedLocations = {}
    for (let [k, v] of Object.entries(
      game.system.model.Actor.robot.body_parts,
    )) {
      outfitedLocations[k] = false
    }

    // ADD ROBOT ARMOR
    for (let [k, v] of Object.entries(outfitedLocations)) {
      if (!v) {
        let armor = actorData.items.find(
          (i) =>
            i.type == 'robot_armor' &&
            i.system.appareltype == 'armor' &&
            i.system.equipped &&
            i.system.location[k] == true,
        )
        if (armor && !outfitedLocations[k]) {
          outfitedLocations[k] = duplicate(armor.toObject())
        }
      }
    }
    // ADD PLATING AND RESISTANCE BONUSES
    let plating = actorData.items.find(
      (i) =>
        i.type == 'robot_armor' &&
        i.system.appareltype == 'plating' &&
        i.system.equipped,
    )
    if (plating) {
      for (let [k, v] of Object.entries(plating.system.location)) {
        if (outfitedLocations[k] && v) {
          outfitedLocations[k].name += ` over ${plating.name}`
          outfitedLocations[k].system.resistance.physical =
            parseInt(outfitedLocations[k].system.resistance.physical) +
            parseInt(plating.system.resistance.physical)
          outfitedLocations[k].system.resistance.energy =
            parseInt(outfitedLocations[k].system.resistance.energy) +
            parseInt(plating.system.resistance.energy)
          outfitedLocations[k].system.resistance.radiation =
            parseInt(outfitedLocations[k].system.resistance.radiation) +
            parseInt(plating.system.resistance.radiation)
        } else if (!outfitedLocations[k] && v) {
          outfitedLocations[k] = duplicate(plating.toObject())
        }
      }
    }

    // ! SET BODY PARTS TO OUTFIT AND ADD CHARACTER BONUSES
    for (let [k, bodyPart] of Object.entries(actorData.system.body_parts)) {
      if (outfitedLocations[k]) {
        bodyPart.resistance.physical =
          parseInt(outfitedLocations[k].system.resistance.physical) +
          parseInt(actorSystem.resistance.physical)
        bodyPart.resistance.energy =
          parseInt(outfitedLocations[k].system.resistance.energy) +
          parseInt(actorSystem.resistance.energy)
        bodyPart.resistance.radiation =
          parseInt(outfitedLocations[k].system.resistance.radiation) +
          parseInt(actorSystem.resistance.radiation)
      } else {
        bodyPart.resistance.physical = parseInt(actorSystem.resistance.physical)
        bodyPart.resistance.energy = parseInt(actorSystem.resistance.energy)
        bodyPart.resistance.radiation = parseInt(actorSystem.resistance.radiation)
      }
    }
    // ADD OUTFITED LIST FOR DISPLAY
    actorData.system.outfitedLocations = outfitedLocations
  }

  // Calculate Total Weight Of Items
  _getItemsTotalWeight() {
    let physicalItems = this.items.filter((i) => {
      return !i.system.stashed && i.system.weight != null
    })
    // remove powered powerArmor pieces for characters
    if (this.type == 'character') {
      physicalItems = physicalItems.filter((i) => {
        if (i.system.appareltype == 'powerArmor') {
          if (!i.system.powered) return i
        } else {
          return i
        }
      })
    }
    let physicalItemsMap = physicalItems.map((i) => i.toObject())
    let totalWeight = 0
    for (let i of physicalItemsMap) {
      totalWeight += parseFloat(i.system.weight) * parseFloat(i.system.quantity)
    }
    return totalWeight
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return

    // Make modifications to data here. For example:
    //const data = actorData.system
    //data.xp = data.cr * data.cr * 100
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const rolldata = super.getRollData()
    // Prepare character roll data.
    this._getCharacterRollData(rolldata)
    this._getNpcRollData(rolldata)

    return rolldata
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(rolldata) {
    if (this.type !== 'character' && this.type !== 'robot'){
		return
	}
    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (rolldata.attributes) {
      for (let [k, v] of Object.entries(rolldata.attributes)) {
        rolldata[k] = foundry.utils.deepClone(v)
      }
    }

    // Add level for easier access, or fall back to 0.
    if (rolldata.level) {
      rolldata.lvl = rolldata.level.value ?? 0
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(rolldata) {
    if (this.type !== 'npc') return

    // Process additional NPC data here.
  }

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user)
	console.log(data)
	console.log(this)
    // Setup Tokens
    if (this.type === 'character' || this.type === 'robot') {
		console.log("Update PC Tokens")
      this.data.token.update({ vision: true, actorLink: true, disposition: 1 })
    }

    if (this.type === 'creature') {
		console.log("Update Creature Tokens")
      //this.data.token.update({ disposition: 0 })
    }

    // Add Skills to Characters and Robots
    if (this.type === 'character' || this.type === 'robot') {
		console.log("Add Skills to PCs")
      let packSkills = await game.packs.get('fallout-dusty.skills').getDocuments()
      const items = this.items.map((i) => i.toObject())
      packSkills.forEach((s) => {
        items.push(s.toObject())
      })
      this.data.update({ items })
    }
  }
}
