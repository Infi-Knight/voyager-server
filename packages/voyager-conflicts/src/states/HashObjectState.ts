import { ConflictListener } from '../api/ConflictListener'
import { ConflictResolution } from '../api/ConflictResolution'
import { ConflictResolutionStrategy } from '../api/ConflictResolutionStrategy'
import { ObjectState } from '../api/ObjectState'
import { ObjectStateData } from '../api/ObjectStateData'

/**
 * Object state manager using a hashing method provided by user
 */
export class HashObjectState implements ObjectState {
  private hash: (object: any) => string
  private conflictListener: ConflictListener | undefined

  constructor(hashImpl: (object: any) => string) {
    this.hash = hashImpl
  }

  public hasConflict(serverData: ObjectStateData, clientData: ObjectStateData, resolverInfo: any) {
    if (this.hash(serverData) !== this.hash(clientData)) {
      if (this.conflictListener) {
        this.conflictListener.onConflict('Conflict when saving data', serverData, clientData, resolverInfo)
      }
      return true
    }
    return false
  }

  public nextState(currentObjectState: ObjectStateData) {
    // Hash can be calculated at any time and it is not added to object
    return currentObjectState
  }

  public resolveOnClient(serverState: ObjectStateData, clientState: ObjectStateData) {
    return new ConflictResolution(false, serverState, clientState)
  }

  public async resolveOnServer(strategy: ConflictResolutionStrategy, serverState: ObjectStateData, clientState: ObjectStateData) {
    let resolvedState = strategy(serverState, clientState)

    if (resolvedState instanceof Promise) {
      resolvedState = await resolvedState
    }

    resolvedState = this.nextState(resolvedState)

    return new ConflictResolution(true, resolvedState, clientState)
  }

  public setConflictListener(conflictListener: ConflictListener): void {
    this.conflictListener = conflictListener
  }

}
