export type Entity = number;

/**
 * The base World class
 *
 * Stores all the component data for all entities, as well as the component
 * masks.
 *
 * Creating and destroying entities is O(1).
 */
export class WorldImpl {
    Signature: Array<number> = [];
    Graveyard: Array<Entity> = [];
}

// Methods are free functions for the sake of serialization and tree-shaking.

export function create_entity(world: WorldImpl) {
    if (world.Graveyard.length > 0) {
        return world.Graveyard.pop()!;
    }

    // Push a new signature and return its index.
    return world.Signature.push(0) - 1;
}

export function destroy_entity(world: WorldImpl, entity: Entity) {
    world.Signature[entity] = 0;

    if (DEBUG && world.Graveyard.includes(entity)) {
        throw new Error("Entity already in graveyard.");
    }

    world.Graveyard.push(entity);
}
