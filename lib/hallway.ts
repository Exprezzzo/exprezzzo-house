import analytics from './analytics'
import costGuard from './cost-guard'

interface HallwayMessage {
  id: string
  fromRoom: string
  toRoom: string
  type: 'TASK' | 'RESULT' | 'CONTEXT' | 'HANDOFF'
  payload: any
  metadata: {
    cost: number
    timestamp: string
    userId?: string
    sessionId?: string
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  }
  receipt?: {
    sent: boolean
    acknowledged: boolean
    processed: boolean
  }
}

interface RoomContext {
  currentTask: any
  history: HallwayMessage[]
  capabilities: string[]
  workingMemory: any
  lastActivity: string
}

class HallwaySystem {
  private messageQueue: Map<string, HallwayMessage[]> = new Map()
  private roomContexts: Map<string, RoomContext> = new Map()
  private messageHistory: HallwayMessage[] = []

  private readonly ROOMS = {
    ARCHITECT: 'architect',
    ANALYST: 'analyst', 
    DEVELOPER: 'developer',
    QUALITY: 'quality',
    CURATOR: 'curator',
    MASTER: 'master'
  }

  constructor() {
    // Initialize room contexts
    Object.values(this.ROOMS).forEach(room => {
      this.roomContexts.set(room, {
        currentTask: null,
        history: [],
        capabilities: this.getRoomCapabilities(room),
        workingMemory: {},
        lastActivity: new Date().toISOString()
      })
      this.messageQueue.set(room, [])
    })
  }

  async sendMessage(
    fromRoom: string,
    toRoom: string,
    type: HallwayMessage['type'],
    payload: any,
    priority: HallwayMessage['metadata']['priority'] = 'NORMAL'
  ): Promise<string> {
    // Cost validation before sending
    const estimatedCost = this.calculateMessageCost(payload)
    const costCheck = await costGuard.checkCost(estimatedCost, 'hallway_message')
    
    if (!costCheck.allowed) {
      throw new Error(`Message blocked by cost guard: ${costCheck.reason}`)
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const message: HallwayMessage = {
      id: messageId,
      fromRoom,
      toRoom,
      type,
      payload,
      metadata: {
        cost: costCheck.adjustedCost || estimatedCost,
        timestamp: new Date().toISOString(),
        priority
      },
      receipt: {
        sent: false,
        acknowledged: false,
        processed: false
      }
    }

    // Add to target room's queue
    const targetQueue = this.messageQueue.get(toRoom)
    if (!targetQueue) {
      throw new Error(`Unknown room: ${toRoom}`)
    }

    // Priority insertion
    if (priority === 'URGENT') {
      targetQueue.unshift(message)
    } else if (priority === 'HIGH') {
      const urgentCount = targetQueue.findIndex(m => m.metadata.priority !== 'URGENT')
      targetQueue.splice(urgentCount === -1 ? 0 : urgentCount, 0, message)
    } else {
      targetQueue.push(message)
    }

    // Update receipt and history
    message.receipt!.sent = true
    this.messageHistory.push(message)
    
    // Update room contexts
    this.updateRoomContext(fromRoom, message, 'sent')
    this.updateRoomContext(toRoom, message, 'received')

    // Analytics
    await analytics.logEvent('HALLWAY_MESSAGE_SENT', {
      messageId,
      fromRoom,
      toRoom,
      type,
      cost: message.metadata.cost,
      priority
    })

    return messageId
  }

  async receiveMessage(roomName: string): Promise<HallwayMessage | null> {
    const queue = this.messageQueue.get(roomName)
    if (!queue || queue.length === 0) {
      return null
    }

    const message = queue.shift()!
    message.receipt!.acknowledged = true

    // Update context
    this.updateRoomContext(roomName, message, 'processing')

    return message
  }

  async markProcessed(messageId: string, result?: any): Promise<void> {
    const message = this.messageHistory.find(m => m.id === messageId)
    if (message) {
      message.receipt!.processed = true
      
      if (result) {
        // Send result back if needed
        await this.sendMessage(
          message.toRoom,
          message.fromRoom,
          'RESULT',
          { originalMessageId: messageId, result },
          'NORMAL'
        )
      }

      await analytics.logEvent('HALLWAY_MESSAGE_PROCESSED', {
        messageId,
        processingTime: Date.now() - new Date(message.metadata.timestamp).getTime(),
        hasResult: !!result
      })
    }
  }

  async handoff(
    fromRoom: string,
    toRoom: string,
    task: any,
    context: any = {}
  ): Promise<string> {
    return this.sendMessage(fromRoom, toRoom, 'HANDOFF', {
      task,
      context,
      handoffReason: 'CAPABILITY_TRANSFER',
      preserveContext: true
    }, 'HIGH')
  }

  getRoomCapabilities(roomName: string): string[] {
    const capabilities = {
      architect: ['SYSTEM_DESIGN', 'ARCHITECTURE', 'PLANNING', 'SPECIFICATIONS'],
      analyst: ['ANALYSIS', 'RESEARCH', 'DATA_PROCESSING', 'INSIGHTS'], 
      developer: ['IMPLEMENTATION', 'CODING', 'INTEGRATION', 'TESTING'],
      quality: ['TESTING', 'VALIDATION', 'VERIFICATION', 'COMPLIANCE'],
      curator: ['PATTERN_CAPTURE', 'KNOWLEDGE_MANAGEMENT', 'OPTIMIZATION'],
      master: ['COORDINATION', 'DECISION_MAKING', 'RESOURCE_ALLOCATION']
    }
    
    return capabilities[roomName as keyof typeof capabilities] || []
  }

  private calculateMessageCost(payload: any): number {
    // Simple cost calculation based on payload size
    const payloadSize = JSON.stringify(payload).length
    const baseCost = 0.000005 // $0.000005 base cost
    const sizeCost = payloadSize * 0.0000001 // $0.0000001 per character
    
    return baseCost + sizeCost
  }

  private updateRoomContext(roomName: string, message: HallwayMessage, action: 'sent' | 'received' | 'processing'): void {
    const context = this.roomContexts.get(roomName)
    if (context) {
      context.history.push(message)
      context.lastActivity = new Date().toISOString()
      
      if (action === 'processing' && message.type === 'HANDOFF') {
        context.currentTask = message.payload.task
        context.workingMemory = { ...context.workingMemory, ...message.payload.context }
      }

      // Keep only last 50 messages to manage memory
      if (context.history.length > 50) {
        context.history = context.history.slice(-50)
      }
    }
  }

  // Context preservation and transfer
  async preserveContext(roomName: string, contextData: any): Promise<void> {
    const context = this.roomContexts.get(roomName)
    if (context) {
      context.workingMemory = { ...context.workingMemory, ...contextData }
    }
  }

  async getContext(roomName: string): Promise<RoomContext | null> {
    return this.roomContexts.get(roomName) || null
  }

  // Message queue management
  getQueueStatus(): Record<string, number> {
    const status: Record<string, number> = {}
    this.messageQueue.forEach((queue, roomName) => {
      status[roomName] = queue.length
    })
    return status
  }

  async clearQueue(roomName: string): Promise<void> {
    const queue = this.messageQueue.get(roomName)
    if (queue) {
      queue.length = 0
      await analytics.logEvent('HALLWAY_QUEUE_CLEARED', { roomName })
    }
  }

  // Debug and monitoring
  getMessageHistory(limit: number = 20): HallwayMessage[] {
    return this.messageHistory.slice(-limit)
  }

  getSystemStats() {
    const totalMessages = this.messageHistory.length
    const totalCost = this.messageHistory.reduce((sum, msg) => sum + msg.metadata.cost, 0)
    const queueSizes = this.getQueueStatus()
    
    return {
      totalMessages,
      totalCost: parseFloat(totalCost.toFixed(8)),
      queueSizes,
      activeRooms: Object.keys(this.roomContexts).length,
      lastActivity: Math.max(...Array.from(this.roomContexts.values()).map(c => 
        new Date(c.lastActivity).getTime()
      ))
    }
  }
}

// Singleton instance
const hallway = new HallwaySystem()

export default hallway
export type { HallwayMessage, RoomContext }