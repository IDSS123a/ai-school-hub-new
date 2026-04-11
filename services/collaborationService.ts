
import { Collaborator, CollaborationEvent, UserProfile } from '../types';

/**
 * Service to simulate real-time collaboration using BroadcastChannel API.
 * This allows multiple tabs/windows in the same browser to communicate updates.
 */

const CHANNEL_NAME = 'ai_school_hub_collaboration';
// Using only derivatives of Primary (#FFCB29), Secondary (#08ABE6), Accent (#035EA1)
const COLORS = [
    '#FFCB29', // Primary
    '#08ABE6', // Secondary
    '#035EA1', // Accent
    '#0689B8', // Slate 600
    '#E6B218', // Primary Dark
    '#0284C7', // Secondary Dark
    '#024678', // Accent Dark
    '#8ACAF0', // Slate 400
    '#FCD34D', // Primary Light
    '#67E8F9'  // Secondary Light (Cyan)
];

export class CollaborationService {
  private channel: BroadcastChannel;
  private promptId: string;
  private currentUser: UserProfile;
  private listeners: ((event: CollaborationEvent) => void)[] = [];
  
  // Track active users in memory
  private activeCollaborators: Map<string, Collaborator> = new Map();

  constructor(promptId: string, currentUser: UserProfile) {
    this.promptId = promptId;
    this.currentUser = currentUser;
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    
    this.channel.onmessage = (ev) => {
      const event = ev.data as CollaborationEvent;
      // Only process events for the current prompt context
      if (event.promptId === this.promptId) {
        this.handleEvent(event);
      }
    };

    // Announce presence immediately
    this.announcePresence();
    
    // Handle window closing/refreshing
    window.addEventListener('beforeunload', this.handleUnload);
  }

  private handleUnload = () => {
      this.sendLeaveEvent();
  };

  private handleEvent(event: CollaborationEvent) {
    // Update local collaborator list
    if (event.type === 'presence_update') {
      const collaborator = event.payload as Collaborator;
      if (collaborator.userId !== this.currentUser.email) {
          this.activeCollaborators.set(collaborator.userId, collaborator);
      }
    } else if (event.type === 'client_leave') {
       const userId = event.payload.userId;
       this.activeCollaborators.delete(userId);
    }

    // Notify listeners
    this.listeners.forEach(fn => fn(event));
  }

  public subscribe(callback: (event: CollaborationEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public sendContentUpdate(newContent: string) {
    const event: CollaborationEvent = {
      type: 'content_update',
      promptId: this.promptId,
      senderId: this.currentUser.email,
      payload: { content: newContent }
    };
    this.channel.postMessage(event);
  }

  public announcePresence() {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const collaborator: Collaborator = {
      userId: this.currentUser.email,
      name: this.currentUser.name,
      picture: this.currentUser.picture,
      color: color
    };
    
    const event: CollaborationEvent = {
      type: 'presence_update',
      promptId: this.promptId,
      senderId: this.currentUser.email,
      payload: collaborator
    };
    this.channel.postMessage(event);
  }

  public sendLeaveEvent() {
      const event: CollaborationEvent = {
          type: 'client_leave',
          promptId: this.promptId,
          senderId: this.currentUser.email,
          payload: { userId: this.currentUser.email, name: this.currentUser.name }
      };
      this.channel.postMessage(event);
  }

  public getCollaborators(): Collaborator[] {
     return Array.from(this.activeCollaborators.values());
  }

  public disconnect() {
    this.sendLeaveEvent();
    window.removeEventListener('beforeunload', this.handleUnload);
    this.channel.close();
  }
}
